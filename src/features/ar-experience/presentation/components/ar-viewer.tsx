"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, RotateCcw, Settings, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/atoms/button";
import type { ArExperienceConfig } from "@/features/ar-experience/domain/ar-experience";
import { useArExperience } from "@/features/ar-experience/presentation/hooks/use-ar-experience";

interface ArViewerProps {
  config: ArExperienceConfig;
  backHref?: string;
  artwork?: {
    title: string;
    artistName: string;
  };
}

export function ArViewer({
  config,
  backHref = "/",
}: ArViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autoStartedRef = useRef(false);

  const stableConfig = useMemo(
    () => ({
      targetUrl: config.targetUrl,
      targetIndex: config.targetIndex,
      overlay: config.overlay,
    }),
    [config.overlay, config.targetIndex, config.targetUrl],
  );

  const {
    status,
    error,
    cameraPermissionIssue,
    start,
    stop,
    dismissCameraPermissionHelp,
  } = useArExperience(stableConfig);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || autoStartedRef.current) return;

    autoStartedRef.current = true;
    void start(container);

    return () => {
      void stop();
    };
  }, [start, stop]);

  const retry = () => {
    const container = containerRef.current;
    if (container) void start(container);
  };

  return (
    <main className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-black text-white">
      <div
        ref={containerRef}
        className="absolute inset-0 isolate overflow-hidden bg-black [&>video]:!z-0 [&>video]:!opacity-100 [&>video]:!visible [&>canvas]:!z-[1] [&>canvas]:pointer-events-none [&>div]:!z-[2] [&>div]:pointer-events-none"
      />

      <Link
        href={backHref}
        aria-label="Back"
        className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-30 sm:left-6"
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-full border-white/25 bg-black/25 text-white shadow-lg backdrop-blur-md hover:bg-black/45 hover:text-white"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
          <span className="sr-only">Back</span>
        </Button>
      </Link>

      {cameraPermissionIssue && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="camera-permission-title"
            className="w-full max-w-md rounded-[2rem] border border-white/12 bg-[#0b0b0e]/95 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
                <Settings className="size-5" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={dismissCameraPermissionHelp}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close camera permission help"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-amber-200/70">
                iPhone Safari
              </p>
              <h2
                id="camera-permission-title"
                className="mt-2 text-xl font-semibold tracking-tight"
              >
                Camera permission is required
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {cameraPermissionIssue === "timeout"
                  ? "Safari did not show the camera permission prompt."
                  : "Safari has blocked camera access for this website."}
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <ol className="space-y-3 text-sm leading-5 text-white/75">
                <li>1. Tap <strong className="font-medium text-white">aA → Website Settings</strong>.</li>
                <li>2. Set <strong className="font-medium text-white">Camera → Allow</strong>.</li>
                <li>3. Return here and tap <strong className="font-medium text-white">Try again</strong>.</li>
              </ol>
            </div>

            <p className="mt-4 text-xs leading-5 text-white/40">
              If the link opened inside Messenger, Zalo, Facebook, or another in-app browser, open it directly in Safari.
            </p>

            <Button
              type="button"
              className="mt-5 w-full bg-white text-black hover:bg-white/90"
              onClick={retry}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        </div>
      )}

      {status === "error" && !cameraPermissionIssue && error && (
        <div className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-white/12 bg-black/70 p-4 backdrop-blur-xl">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Camera could not start</p>
            <p className="mt-1 text-xs leading-5 text-white/60">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-3 text-xs font-medium text-white underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
