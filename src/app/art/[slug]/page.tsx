import Link from "next/link";
import { ArrowLeft, Camera, ScanLine } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
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
    <main className="min-h-screen bg-neutral-950 px-5 py-6 text-white sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/">
          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Home
          </Button>
        </Link>

        <section className="mx-auto mt-10 grid max-w-4xl gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white p-3 shadow-2xl">
            {/* Supabase public storage domain is runtime-configured. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork.targetImageUrl}
              alt={artwork.title}
              className="aspect-[4/5] w-full rounded-[1.45rem] object-cover"
            />
          </div>

          <div>
            <Badge className="border-white/15 bg-white/5 text-white/70">
              <ScanLine className="mr-1 size-3" aria-hidden="true" />
              AR artwork
            </Badge>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.045em]">
              {artwork.title}
            </h1>
            <p className="mt-3 text-base text-white/55">by {artwork.artistName}</p>
            {artwork.description && (
              <p className="mt-7 max-w-xl whitespace-pre-wrap text-sm leading-7 text-white/65">
                {artwork.description}
              </p>
            )}

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-medium">How to view it</p>
              <p className="mt-2 text-xs leading-5 text-white/50">
                Tap Start AR, allow camera access, then point your phone at the physical
                artwork shown here. Keep the full artwork visible while tracking starts.
              </p>
            </div>

            <Link href={`/ar/${artwork.slug}`} className="mt-6 block sm:inline-block">
              <Button size="lg" className="w-full bg-white text-black hover:bg-white/90">
                <Camera className="size-4" aria-hidden="true" />
                Start AR
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
