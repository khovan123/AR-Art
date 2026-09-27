"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ScanLine,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/atoms/badge";
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
  artwork,
}: ArViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stableConfig = useMemo(
    () => ({
      targetUrl: config.targetUrl,
      targetIndex: config.targetIndex,
      overlay: config.overlay,
    }),
    [config.overlay, config.targetIndex, config.targetUrl],
  );
  const { status, error, start, stop } = useArExperience(stableConfig);

  useEffect(() => () => void stop(), [stop]);

  const isRunning =
    status === "starting" || status === "scanning" || status === "found";

  const statusCopy = {
    idle: "Camera is off",
    starting: "Starting camera…",
    scanning: artwork ? "Point at the physical artwork" : "Point at the demo target",
    found: "Artwork detected",
    error: "Camera could not start",
  };

  return (
    <main className="relative min-h-svh overflow-hidden bg-black text-white">
      <div
        ref={containerRef}
        className="absolute inset-0 [&>video]:!h-full [&>video]:!w-full [&>video]:object-cover"
      />
      {!isRunning && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#292524_0%,#111827_45%,#020617_80%)]" />
      )}

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/45 via-transparent to-black/60" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6">
        <Link href={backHref} className="pointer-events-auto">
          <Button
            variant="outline"
            size="icon"
            className="border-white/15 bg-black/30 text-white hover:bg-black/50 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <Badge className="max-w-[70vw] truncate border-white/15 bg-black/30 text-white/80">
          {artwork ? artwork.title : "WebAR demo"}
        </Badge>
      </header>

      <section className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6">
        {(status === "scanning" || status === "starting") && (
          <div className="aspect-[1.8116] w-full max-w-sm rounded-3xl border border-dashed border-white/60 shadow-[0_0_0_999px_rgba(0,0,0,0.08)]">
            <ScanLine
              className="mx-auto mt-4 size-6 animate-pulse text-white/80"
              aria-hidden="true"
            />
          </div>
        )}
        {status === "found" && (
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-950/65 px-4 py-2 text-sm text-emerald-100 backdrop-blur">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Artwork detected
          </div>
        )}
      </section>

      <footer className="absolute inset-x-0 bottom-0 z-30 p-4 sm:p-6">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3 rounded-3xl border border-white/10 bg-black/50 p-4 backdrop-blur-xl">
          {artwork && (
            <div className="border-b border-white/10 pb-3">
              <p className="truncate text-sm font-medium">{artwork.title}</p>
              <p className="mt-0.5 truncate text-xs text-white/50">
                by {artwork.artistName}
              </p>
            </div>
          )}

          <div className="flex items-start gap-3">
            {status === "error" ? (
              <TriangleAlert
                className="mt-0.5 size-5 shrink-0 text-amber-300"
                aria-hidden="true"
              />
            ) : (
              <Camera
                className="mt-0.5 size-5 shrink-0 text-white/80"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{statusCopy[status]}</p>
              <p className="mt-1 text-xs leading-5 text-white/60">
                {error ??
                  (artwork
                    ? "Keep the full physical artwork in frame until the animation locks onto it."
                    : "Open the demo target on another screen or print it, then point this camera at it.")}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {!isRunning ? (
              <Button
                className="flex-1 bg-white text-black hover:bg-white/90"
                onClick={() =>
                  containerRef.current && void start(containerRef.current)
                }
              >
                Start camera
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1 border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                onClick={() => void stop()}
              >
                Stop camera
              </Button>
            )}
            {!artwork && (
              <Link href="/demo-target" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                >
                  Target image
                </Button>
              </Link>
            )}
          </div>
        </div>
      </footer>
    </main>
  );
}
