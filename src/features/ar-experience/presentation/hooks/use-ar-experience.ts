"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ArSession } from "@/features/ar-experience/application/use-cases/create-ar-session";
import type {
  ArExperienceConfig,
  ArExperienceStatus,
} from "@/features/ar-experience/domain/ar-experience";
import {
  MindArImageEngine,
  preloadMindArRuntime,
} from "@/features/ar-experience/infrastructure/mindar/mindar-image-engine";

const RUNTIME_TIMEOUT_MS = 15_000;
const IOS_CAMERA_RELEASE_DELAY_MS = 180;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(message)), timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (cause) => {
        window.clearTimeout(timeout);
        reject(cause);
      },
    );
  });
}

function describeCameraError(cause: unknown) {
  if (!(cause instanceof DOMException)) {
    return cause instanceof Error ? cause.message : "Unable to access the camera.";
  }

  switch (cause.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera permission is blocked for this site. In Safari, open Website Settings and set Camera to Allow.";
    case "NotFoundError":
      return "No usable camera was found on this iPhone.";
    case "NotReadableError":
      return "Safari could not open the camera. Close other camera apps and try again.";
    case "OverconstrainedError":
      return "Safari could not select the rear camera. Reload the page and try again.";
    default:
      return cause.message || "Unable to access the camera.";
  }
}

async function requestIosCameraPermission() {
  if (!window.isSecureContext) {
    throw new Error("Camera access requires HTTPS.");
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "Camera access is unavailable. Open this page directly in Safari, not an in-app browser.",
    );
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
      },
    });
  } catch (cause) {
    throw new Error(describeCameraError(cause));
  }
}

function releaseStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function useArExperience(config: ArExperienceConfig) {
  const sessionRef = useRef<ArSession | null>(null);
  const startInFlightRef = useRef(false);
  const runtimePromiseRef = useRef<Promise<void> | null>(null);
  const [status, setStatus] = useState<ArExperienceStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Warm the heavy MindAR/TensorFlow chunk in the background, but never
    // disable the camera button while it is loading. iPhone Safari can leave
    // long module requests pending, so the explicit tap flow has its own
    // timeout and error state.
    runtimePromiseRef.current = preloadMindArRuntime();
    runtimePromiseRef.current.catch(() => undefined);
  }, []);

  const start = useCallback(
    async (container: HTMLElement) => {
      if (startInFlightRef.current) return;

      startInFlightRef.current = true;
      setError(null);
      setStatus("starting");

      let permissionStream: MediaStream | null = null;

      try {
        // This is intentionally the first awaited browser API after the user
        // taps. It keeps Safari's camera permission request tied to the gesture.
        permissionStream = await requestIosCameraPermission();

        const runtimePromise =
          runtimePromiseRef.current ?? preloadMindArRuntime();
        runtimePromiseRef.current = runtimePromise;

        await withTimeout(
          runtimePromise,
          RUNTIME_TIMEOUT_MS,
          "The AR engine took too long to load on Safari. Reload the page and try again.",
        );

        releaseStream(permissionStream);
        permissionStream = null;

        // Give WebKit a brief moment to release the temporary permission stream
        // before MindAR opens the same rear camera for tracking.
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, IOS_CAMERA_RELEASE_DELAY_MS);
        });

        const session = new ArSession(new MindArImageEngine());
        sessionRef.current = session;

        await session.start(container, config, {
          onScanning: () => setStatus("scanning"),
          onTargetFound: () => setStatus("found"),
          onTargetLost: () => setStatus("scanning"),
          onError: (arError) => {
            setError(arError.message);
            setStatus("error");
          },
        });
      } catch (cause) {
        releaseStream(permissionStream);
        permissionStream = null;

        const message =
          cause instanceof Error ? cause.message : "Unable to start the AR camera.";
        setError(message);
        setStatus("error");
      } finally {
        startInFlightRef.current = false;
      }
    },
    [config],
  );

  const stop = useCallback(async () => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) await session.stop();
    setStatus("idle");
  }, []);

  return { status, error, start, stop };
}
