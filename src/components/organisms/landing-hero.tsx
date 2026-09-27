import Link from "next/link";
import { ArrowRight, Camera, Plus } from "lucide-react";

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { ArtGalleryScene } from "@/components/organisms/art-gallery-scene";

export function LandingHero() {
  return (
    <section className="relative mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-[90rem] items-center gap-8 overflow-hidden px-5 pb-14 pt-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-20 lg:pt-10">
      <div className="relative z-10 max-w-3xl">
        <Badge className="mb-7 border-white/10 bg-white/[0.045] text-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          DIGITAL EXHIBITION · WEBAR
        </Badge>

        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-fuchsia-300/70">
          Physical art, second dimension
        </p>

        <h1 className="text-balance text-5xl font-semibold leading-[0.92] tracking-[-0.065em] text-white sm:text-7xl lg:text-[6.7rem]">
          Art that
          <span className="block bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
            escapes the frame.
          </span>
        </h1>

        <p className="mt-7 max-w-xl text-base leading-7 text-white/52 sm:text-lg sm:leading-8">
          Turn a physical artwork into an interactive digital piece. Visitors scan,
          step into the layer, and watch the work move in space—directly in the browser.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/create">
            <Button
              size="lg"
              className="border border-white/10 bg-white text-black shadow-[0_12px_40px_rgba(255,255,255,0.12)] hover:bg-white/90"
            >
              <Plus className="size-4" aria-hidden="true" />
              Create an artwork
            </Button>
          </Link>
          <Link href="/ar">
            <Button
              size="lg"
              variant="outline"
              className="border-white/12 bg-white/[0.035] text-white hover:bg-white/[0.08] hover:text-white"
            >
              <Camera className="size-4" aria-hidden="true" />
              Enter AR demo
            </Button>
          </Link>
        </div>

        <Link
          href="/demo-target"
          className="mt-7 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/35 transition hover:text-white/70"
        >
          Open demo target
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative z-10 flex min-h-[34rem] items-center justify-center lg:min-h-[44rem]">
        <ArtGalleryScene />
      </div>
    </section>
  );
}
