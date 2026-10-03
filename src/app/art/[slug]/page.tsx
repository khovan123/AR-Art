import Link from "next/link";
import { ArrowLeft, Camera, ScanLine, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
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
    <main className="museum-room relative min-h-screen overflow-hidden px-5 py-6 text-white sm:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:76px_76px]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[38rem] w-[48rem] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-[88rem]">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button
              variant="outline"
              className="border-white/10 bg-white/[0.04] text-white/65 backdrop-blur hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Gallery
            </Button>
          </Link>

          <Badge className="border-white/10 bg-white/[0.04] text-white/55">
            EVERIE DIGITAL ITEM
          </Badge>
        </div>

        <section className="mx-auto grid min-h-[calc(100svh-6rem)] max-w-6xl gap-12 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative flex min-h-[34rem] items-center justify-center">
            <div className="absolute left-1/2 top-[12%] h-[72%] w-[72%] -translate-x-1/2 rounded-full bg-gradient-to-b from-violet-300/10 to-cyan-300/5 blur-3xl" />
            <div className="museum-frame w-full max-w-md rounded-[1.1rem] bg-gradient-to-br from-white/22 via-white/8 to-white/15 p-[7px]">
              <div className="rounded-[0.82rem] bg-[#111116] p-3">
                {/* Supabase public storage domain is runtime-configured. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artwork.targetImageUrl}
                  alt={artwork.title}
                  className="aspect-[4/5] w-full rounded-[0.48rem] object-cover"
                />
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-[4%] left-1/2 h-20 w-[58%] -translate-x-1/2 rounded-[50%] bg-black/55 blur-3xl" />
          </div>

          <div className="lg:pl-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/10 bg-white/[0.04] text-white/55">
                <ScanLine className="mr-1 size-3" aria-hidden="true" />
                2D AR
              </Badge>
              <Badge className="border-violet-300/15 bg-violet-300/[0.07] text-violet-200/70">
                <Sparkles className="mr-1 size-3" aria-hidden="true" />
                Digital collectible
              </Badge>
            </div>

            <p className="mt-8 text-xs uppercase tracking-[0.28em] text-white/25">
              Everie product
            </p>
            <h1 className="mt-3 max-w-2xl text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-white sm:text-6xl">
              {artwork.title}
            </h1>
            <p className="mt-4 text-sm uppercase tracking-[0.18em] text-white/38">
              {artwork.artistName}
            </p>

            {artwork.description && (
              <p className="mt-8 max-w-xl whitespace-pre-wrap text-sm leading-7 text-white/52">
                {artwork.description}
              </p>
            )}

            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
              <div className="bg-[#09090c] p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/25">
                  Experience
                </p>
                <p className="mt-2 text-sm text-white/68">
                  Image-tracked 2D digital layer
                </p>
              </div>
              <div className="bg-[#09090c] p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/25">
                  Collection
                </p>
                <p className="mt-2 text-sm text-white/68">
                  Saved to your Everie account after recognition
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href={`/ar/${artwork.slug}`}>
                <Button
                  size="lg"
                  className="border border-white/10 bg-white text-black shadow-[0_18px_55px_rgba(255,255,255,0.12)] hover:bg-white/90"
                >
                  <Camera className="size-4" aria-hidden="true" />
                  Open AR
                </Button>
              </Link>

              <Link href="/collection">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/12 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white"
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  Collection
                </Button>
              </Link>
            </div>

            <div className="mt-3">
              <ShareArtworkButton
                title={artwork.title}
                text={
                  artwork.description ||
                  `Khám phá nội dung AR của ${artwork.title} trong Everie.`
                }
                imageUrl={artwork.targetImageUrl}
              />
            </div>

            <p className="mt-4 max-w-lg text-xs leading-5 text-white/32">
              Bạn cần đăng nhập tài khoản Everie trước khi quét. Khi hệ thống nhận diện đúng sản phẩm, item tương ứng được ghi nhận ngay vào Collection trên cloud của tài khoản.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
