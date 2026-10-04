import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";
import { CollectionGrid } from "@/features/collection/presentation/components/collection-grid";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const { listPublishedArtworks } = createArtworkServices();
  const artworks = await listPublishedArtworks.execute();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none absolute right-[8%] top-24 size-80 rounded-full bg-violet-700/7 blur-[130px]" />
      <header className="relative mx-auto flex w-full max-w-[94rem] items-center justify-between border-b border-white/12 px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/50 transition hover:text-white">
          <ArrowLeft className="size-3.5" /> Gallery
        </Link>
        <Link href="/" className="text-lg font-semibold tracking-[-0.04em]">EVERIE</Link>
        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-white/28">Private archive</span>
      </header>

      <section className="relative mx-auto w-full max-w-[94rem] px-5 pb-12 pt-16 sm:px-8 lg:px-12 lg:pb-16 lg:pt-24">
        <div className="grid gap-10 lg:grid-cols-[0.38fr_1.62fr]">
          <p className="text-[0.68rem] uppercase tracking-[0.25em] text-violet-200/45">Your collection</p>
          <div>
            <h1 className="max-w-5xl font-serif text-6xl leading-[0.88] tracking-[-0.055em] sm:text-8xl lg:text-9xl">
              Works you have <span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">unlocked.</span>
            </h1>
          </div>
        </div>
      </section>

      <div className="relative mx-auto w-full max-w-[94rem] px-5 pb-24 sm:px-8 lg:px-12">
        <CollectionGrid artworks={artworks} />
      </div>
    </main>
  );
}
