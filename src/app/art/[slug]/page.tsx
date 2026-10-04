import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Camera, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { HistoryBackButton } from "@/components/molecules/history-back-button";
import { EditArtworkButton } from "@/features/artwork/presentation/components/edit-artwork-button";
import { ShareArtworkButton } from "@/features/artwork/presentation/components/share-artwork-button";
import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";

export const dynamic = "force-dynamic";

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { getPublishedArtwork } = createArtworkServices();
  const artwork = await getPublishedArtwork.execute(slug);

  if (!artwork) notFound();

  return (
    <main className="min-h-screen bg-[#efeee8] text-[#11110f]">
      <header className="mx-auto flex w-full max-w-[94rem] items-center justify-between border-b border-black/15 px-5 py-5 sm:px-8 lg:px-12">
        <HistoryBackButton
          fallbackHref="/"
          variant="ghost"
          className="h-auto rounded-none p-0 text-xs uppercase tracking-[0.14em] text-black/55 hover:bg-transparent hover:text-black"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Gallery
        </HistoryBackButton>
        <Link href="/" className="text-lg font-semibold tracking-[-0.045em]">EVERIE</Link>
        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-black/35">Digital work</span>
      </header>

      <section className="mx-auto grid min-h-[calc(100svh-4.8rem)] w-full max-w-[94rem] gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.16fr_0.84fr] lg:items-center lg:px-12 lg:py-16">
        <div className="relative">
          <div className="overflow-hidden bg-[#d7d6cf]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork.targetImageUrl}
              alt={artwork.title}
              className="mx-auto aspect-[4/5] max-h-[74svh] w-full object-contain"
            />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-black/20 pt-3 text-[0.62rem] uppercase tracking-[0.15em] text-black/38">
            <span>Everie archive</span>
            <span>AR enabled</span>
          </div>
        </div>

        <div className="lg:pl-8">
          <div className="flex items-center justify-between gap-6 border-t border-black/20 pt-3 text-[0.62rem] uppercase tracking-[0.16em] text-black/38">
            <span>Work / {artwork.slug}</span>
            <span>2D AR</span>
          </div>

          <h1 className="mt-10 font-serif text-6xl leading-[0.86] tracking-[-0.06em] sm:text-8xl">
            {artwork.title}
          </h1>
          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-black/45">{artwork.artistName}</p>

          {artwork.description ? (
            <p className="mt-9 max-w-xl whitespace-pre-wrap text-sm leading-7 text-black/55">
              {artwork.description}
            </p>
          ) : null}

          <div className="mt-12 grid grid-cols-2 border-y border-black/20 py-4 text-xs uppercase tracking-[0.12em] text-black/45">
            <span>AR layer</span>
            <span className="text-right">Collect after scan</span>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Link
              href={`/ar/${artwork.slug}`}
              className="inline-flex h-12 items-center gap-2 bg-[#11110f] px-5 text-xs font-medium uppercase tracking-[0.12em] text-[#efeee8] transition hover:bg-black/85"
            >
              <Camera className="size-4" aria-hidden="true" />
              Open AR
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>

            <Link
              href="/collection"
              className="inline-flex h-12 items-center gap-2 border border-black/25 px-5 text-xs font-medium uppercase tracking-[0.12em] text-black/65 transition hover:border-black hover:text-black"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Collection
            </Link>

            <EditArtworkButton
              id={artwork.id}
              ownerId={artwork.ownerId}
              title={artwork.title}
              artistName={artwork.artistName}
              description={artwork.description}
              status={artwork.status}
            />
          </div>

          <div className="mt-3">
            <ShareArtworkButton
              title={artwork.title}
              text={artwork.description || `Discover ${artwork.title} in Everie.`}
              imageUrl={artwork.targetImageUrl}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
