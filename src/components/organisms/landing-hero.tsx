import Link from "next/link";
import { ArrowRight, Camera, ScanLine, Sparkles } from "lucide-react";

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";

export function LandingHero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-12 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:pb-28 md:pt-20">
      <div>
        <Badge className="mb-6">Open-source WebAR · no app install</Badge>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl md:text-7xl">
          Make physical art come alive in the browser.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          Point a phone camera at an artwork. AR Art recognizes the image and anchors animated 3D content directly on top of it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/ar">
            <Button size="lg">
              Try camera demo <Camera className="size-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="/demo-target">
            <Button size="lg" variant="outline">
              Open target image <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border border-border bg-neutral-950 p-4 shadow-2xl shadow-black/15">
        <div className="relative h-full overflow-hidden rounded-[1.4rem] bg-[radial-gradient(circle_at_35%_25%,#78350f_0%,#171717_42%,#050505_72%)]">
          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-xs text-white/80 backdrop-blur">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" /> Live camera
          </div>
          <div className="absolute inset-10 top-28 rounded-2xl border border-white/20 bg-white/[0.04]">
            <div className="absolute -inset-1 rounded-2xl border border-amber-300/45 blur-[1px]" />
            <div className="flex h-full items-center justify-center">
              <div className="relative flex size-36 items-center justify-center">
                <Sparkles className="absolute -right-4 -top-6 size-10 text-amber-300" />
                <div className="absolute size-36 animate-[spin_8s_linear_infinite] rounded-[38%] border border-fuchsia-400/70" />
                <div className="absolute size-24 animate-[spin_5s_linear_infinite_reverse] rounded-[44%] border border-cyan-300/70" />
                <ScanLine className="size-12 text-white" />
              </div>
            </div>
          </div>
          <p className="absolute inset-x-6 bottom-7 text-center text-sm text-white/60">
            Image tracking keeps the digital layer attached while the camera moves.
          </p>
        </div>
      </div>
    </section>
  );
}
