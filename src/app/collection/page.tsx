import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";
import { CollectionGrid } from "@/features/collection/presentation/components/collection-grid";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const { listPublishedArtworks } = createArtworkServices();
  const artworks = await listPublishedArtworks.execute();

  return (
    <main className="min-h-screen bg-[#efeee8] text-[#11110f]">
      <header className="mx-auto flex w-full max-w-[94rem] items-center justify-between border-b border-black/15 px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-black/55 transition hover:text-black">
          <ArrowLeft className="size-3.5" /> Gallery
        </Link>
        <span className="text-lg font-semibold tracking-[-0.04em]">EVERIE</span>
        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-black/35">Private archive</span>
      </header>

      <section className="mx-auto w-full max-w-[94rem] px-5 pb-12 pt-16 sm:px-8 lg:px-12 lg:pb-16 lg:pt-24">
        <div className="grid gap-10 lg:grid-cols-[0.38fr_1.62fr]">
          <p className="text-[0.68rem] uppercase tracking-[0.25em] text-black/42">Your collection</p>
          <div>
            <h1 className="max-w-5xl font-serif text-6xl leading-[0.88] tracking-[-0.055em] sm:text-8xl lg:text-9xl">Works you have <span className="italic">unlocked.</span></h1>
            <p className="mt-8 max-w-xl text-sm leading-6 text-black/50">Each recognized Everie piece becomes part of your personal archive.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[94rem] px-5 pb-24 sm:px-8 lg:px-12">
        <CollectionGrid artworks={artworks} />
      </div>
    </main>
  );
}
