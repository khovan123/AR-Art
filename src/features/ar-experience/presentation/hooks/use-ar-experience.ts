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

export function useArExperience(config: ArExperienceConfig) {
  const sessionRef = useRef<ArSession | null>(null);
  const startInFlightRef = useRef(false);
  const [status, setStatus] = useState<ArExperienceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [runtimeReady, setRuntimeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    preloadMindArRuntime()
      .then(() => {
        if (!cancelled) {
          setRuntimeReady(true);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to prepare the AR engine. Reload Safari and try again.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const start = useCallback(
    async (container: HTMLElement) => {
      if (!runtimeReady || startInFlightRef.current) return;

      startInFlightRef.current = true;
      setError(null);
      setStatus("starting");

      const session = new ArSession(new MindArImageEngine());
      sessionRef.current = session;

      try {
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
        const message =
          cause instanceof Error ? cause.message : "Unable to start the AR camera.";
        setError(message);
        setStatus("error");
      } finally {
        startInFlightRef.current = false;
      }
    },
    [config, runtimeReady],
  );

  const stop = useCallback(async () => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) await session.stop();
    setStatus("idle");
  }, []);

  return { status, error, runtimeReady, start, stop };
}
