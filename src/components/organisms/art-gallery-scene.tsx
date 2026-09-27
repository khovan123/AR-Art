"use client";

import { useRef } from "react";
import { ScanLine, Sparkles } from "lucide-react";

export function ArtGalleryScene() {
  const sceneRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const scene = sceneRef.current;
    if (!scene) return;

    const rect = scene.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    scene.style.setProperty("--rx", `${-y * 8}deg`);
    scene.style.setProperty("--ry", `${x * 11}deg`);
    scene.style.setProperty("--mx", `${x * 18}px`);
    scene.style.setProperty("--my", `${y * 14}px`);
  }

  function resetScene() {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.style.setProperty("--rx", "0deg");
    scene.style.setProperty("--ry", "0deg");
    scene.style.setProperty("--mx", "0px");
    scene.style.setProperty("--my", "0px");
  }

  return (
    <div
      ref={sceneRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetScene}
      className="gallery-scene relative mx-auto aspect-[4/5] w-full max-w-[34rem] select-none"
      aria-label="Abstract 3D gallery preview"
    >
      <div className="gallery-glow gallery-glow-a" />
      <div className="gallery-glow gallery-glow-b" />

      <div className="gallery-room">
        <div className="gallery-floor" />
        <div className="gallery-back-wall" />

        <div className="gallery-frame gallery-frame-left">
          <div className="gallery-art gallery-art-a">
            <div className="gallery-orb gallery-orb-a" />
            <div className="gallery-orb gallery-orb-b" />
            <div className="absolute inset-x-5 bottom-5 h-px bg-white/25" />
          </div>
        </div>

        <div className="gallery-frame gallery-frame-main">
          <div className="gallery-art gallery-art-main">
            <div className="gallery-sculpture">
              <div className="gallery-ring gallery-ring-one" />
              <div className="gallery-ring gallery-ring-two" />
              <div className="gallery-core">
                <ScanLine className="size-9 text-white/90" aria-hidden="true" />
              </div>
            </div>
            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/60 backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" />
              live layer
            </div>
          </div>
        </div>

        <div className="gallery-frame gallery-frame-right">
          <div className="gallery-art gallery-art-b">
            <Sparkles
              className="absolute right-4 top-4 size-6 text-white/65"
              aria-hidden="true"
            />
            <div className="gallery-liquid-shape" />
          </div>
        </div>

        <div className="gallery-plinth">
          <div className="gallery-plinth-object" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-10 bottom-3 h-14 rounded-[50%] bg-black/70 blur-2xl" />
    </div>
  );
}
