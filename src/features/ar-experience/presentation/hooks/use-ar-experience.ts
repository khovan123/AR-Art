"use client";

import { useCallback, useRef, useState } from "react";

import { ArSession } from "@/features/ar-experience/application/use-cases/create-ar-session";
import type {
  ArExperienceConfig,
  ArExperienceStatus,
} from "@/features/ar-experience/domain/ar-experience";
import { MindArImageEngine } from "@/features/ar-experience/infrastructure/mindar/mindar-image-engine";

export function useArExperience(config: ArExperienceConfig) {
  const sessionRef = useRef<ArSession | null>(null);
  const [status, setStatus] = useState<ArExperienceStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (container: HTMLElement) => {
      if (status === "starting") return;

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
      } catch {
        // The infrastructure adapter already exposes a user-safe error state.
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
