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

function cameraErrorMessage(cause: unknown) {
  if (!(cause instanceof DOMException)) {
    return cause instanceof Error ? cause.message : "Unable to access the camera.";
  }

  switch (cause.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera permission was blocked. On iPhone Safari, open this site in Safari and allow Camera access for this website.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No usable camera was found on this device.";
    case "NotReadableError":
    case "TrackStartError":
      return "The camera is busy or unavailable. Close other camera apps and try again.";
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "The rear camera could not be selected. Try again or reload Safari.";
    default:
      return cause.message || "Unable to access the camera.";
  }
}

async function requestCameraAccessFromGesture() {
  if (!window.isSecureContext) {
    throw new Error("Camera access requires HTTPS.");
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "This browser does not expose camera access. Open the page directly in Safari on iPhone.",
    );
  }

  let stream: MediaStream | null = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
      },
    });
  } catch (cause) {
    throw new Error(cameraErrorMessage(cause));
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
  }
}

export function useArExperience(config: ArExperienceConfig) {
  const sessionRef = useRef<ArSession | null>(null);
  const [status, setStatus] = useState<ArExperienceStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    preloadMindArRuntime();
  }, []);

  const start = useCallback(
    async (container: HTMLElement) => {
      if (status === "starting") return;

      setError(null);
      setStatus("starting");

      try {
        // Important for iPhone Safari: the first awaited operation from the
        // user's tap is getUserMedia(), so the permission prompt remains tied
        // to the user gesture. MindAR starts only after permission is granted.
        await requestCameraAccessFromGesture();

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
        setError(cameraErrorMessage(cause));
        setStatus("error");
      }
    },
    [config, status],
  );

  const stop = useCallback(async () => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) await session.stop();
    setStatus("idle");
  }, []);

  return { status, error, start, stop };
}
