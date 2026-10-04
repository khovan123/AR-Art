import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { ImmersiveGalleryShowcase } from "@/components/organisms/immersive-gallery-showcase";
import { SiteHeader } from "@/components/organisms/site-header";
import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";

export async function MarketingPage() {
  const { listPublishedArtworks } = createArtworkServices();
  const artworks = await listPublishedArtworks.execute();
  const selected = artworks.slice(0, 6);
  const featured = selected[0];
  const artists = Array.from(
    artworks.reduce((map, artwork) => {
      map.set(artwork.artistName, (map.get(artwork.artistName) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).slice(0, 6);

  return (
    <main className="min-h-screen overflow-hidden bg-[#030305] text-white">
      <div className="relative border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(124,58,237,0.18),transparent_35%),radial-gradient(circle_at_88%_58%,rgba(34,211,238,0.1),transparent_28%)]" />
        <SiteHeader />

        <section className="relative mx-auto grid min-h-[82svh] w-full max-w-[94rem] items-end gap-10 px-5 pb-10 pt-12 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:px-12 lg:pb-16 lg:pt-16">
          <div className="relative z-10 pb-3">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-violet-200/55">
              Digital art platform · AR exhibition
            </p>
            <h1 className="mt-6 font-serif text-[clamp(4.2rem,10vw,9.5rem)] font-normal leading-[0.78] tracking-[-0.075em]">
              Art,
              <span className="block bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text italic text-transparent">
                beyond
              </span>
              <span className="block">the frame.</span>
            </h1>
            <div className="mt-10 flex max-w-md items-end justify-between gap-8 border-t border-white/15 pt-4">
              <p className="text-sm leading-6 text-white/48">
                Physical works open into a digital layer through the browser.
              </p>
              <ArrowDownRight className="size-5 shrink-0 text-white/60" />
            </div>
          </div>

          <div className="relative min-h-[38rem] overflow-hidden border border-white/10 bg-black lg:min-h-[46rem]">
            <ImmersiveGalleryShowcase />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_50%,transparent_22%,rgba(0,0,0,0.18)_58%,rgba(0,0,0,0.72)_100%)]" />

            {featured ? (
              <Link
                href={`/art/${featured.slug}`}
                className="group absolute bottom-6 right-5 z-10 w-[48%] min-w-48 max-w-[23rem] sm:bottom-8 sm:right-8"
              >
                <div className="relative overflow-hidden border border-white/20 bg-black/70 p-2 shadow-[0_28px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl transition duration-500 group-hover:-translate-y-1 group-hover:border-violet-200/45">
                  <div className="relative aspect-[4/5] overflow-hidden bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featured.targetImageUrl}
                      alt={featured.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-[0.58rem] uppercase tracking-[0.22em] text-white/45">Featured work</p>
                      <p className="mt-1 font-serif text-2xl text-white">{featured.title}</p>
                      <p className="mt-1 text-xs text-white/45">{featured.artistName}</p>
                    </div>
                  </div>
                </div>
                <span className="absolute -right-2 -top-2 flex size-11 items-center justify-center border border-white/20 bg-white text-black transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
            ) : null}

            <div className="absolute left-5 top-5 z-10 flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.2em] text-white/45 sm:left-7 sm:top-7">
              <span className="size-1.5 animate-pulse rounded-full bg-cyan-300" />
              Live digital layer
            </div>
          </div>
        </section>
      </div>

      <section id="works" className="relative mx-auto w-full max-w-[94rem] border-b border-white/10 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="pointer-events-none absolute left-[28%] top-12 h-72 w-72 rounded-full bg-violet-600/5 blur-[100px]" />
        <div className="relative grid gap-8 lg:grid-cols-[0.35fr_1.65fr]">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.25em] text-white/38">01 · Selected works</p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/42">
              A changing selection from the current exhibition.
            </p>
          </div>
          <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {selected.map((artwork, index) => (
              <Link
                key={artwork.id}
                href={`/art/${artwork.slug}`}
                className={`group block ${index === 1 || index === 4 ? "lg:mt-16" : ""}`}
              >
                <div className="relative overflow-hidden border border-white/8 bg-white/[0.03]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artwork.targetImageUrl}
                    alt={artwork.title}
                    className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-950/25 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                </div>
                <div className="mt-4 flex items-start justify-between gap-4 border-t border-white/15 pt-3">
                  <div>
                    <h2 className="font-serif text-2xl leading-none text-white">{artwork.title}</h2>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-white/35">{artwork.artistName}</p>
                  </div>
                  <span className="text-xs tabular-nums text-white/25">{String(index + 1).padStart(2, "0")}</span>
                </div>
              </Link>
            ))}
            {selected.length === 0 ? (
              <p className="col-span-full border-t border-white/15 py-12 text-sm text-white/35">
                The first exhibition is being prepared.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/10 bg-[#050509]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_48%,rgba(76,29,149,0.2),transparent_32%),radial-gradient(circle_at_84%_66%,rgba(8,145,178,0.11),transparent_24%)]" />
        <div className="relative mx-auto grid w-full max-w-[94rem] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.6fr_1.4fr] lg:px-12 lg:py-24">
          <div className="relative z-10">
            <p className="text-[0.68rem] uppercase tracking-[0.25em] text-white/38">02 · Exhibition preview</p>
            <h2 className="mt-6 max-w-lg font-serif text-5xl leading-[0.95] tracking-[-0.04em] sm:text-7xl">
              Enter the work,
              <span className="block bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">
                not another interface.
              </span>
            </h2>
            <Link
              href="/ar"
              className="mt-10 inline-flex items-center gap-3 border-b border-white/45 pb-2 text-xs uppercase tracking-[0.16em] text-white/70 transition hover:border-cyan-200 hover:text-white"
            >
              Open AR exhibition <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="relative min-h-[36rem] overflow-hidden border border-white/10 bg-black lg:min-h-[44rem]">
            <ImmersiveGalleryShowcase />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.65),transparent_38%)]" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between border-t border-white/15 pt-4 text-[0.62rem] uppercase tracking-[0.18em] text-white/40 sm:bottom-8 sm:left-8 sm:right-8">
              <span>Web AR · Spatial layer</span>
              <span>Move pointer to explore</span>
            </div>
          </div>
        </div>
      </section>

      <section id="artists" className="mx-auto w-full max-w-[94rem] border-b border-white/10 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.35fr_1.65fr]">
          <p className="text-[0.68rem] uppercase tracking-[0.25em] text-white/38">03 · Artists</p>
          <div>
            {artists.length > 0 ? (
              artists.map(([artist, count], index) => (
                <div
                  key={artist}
                  className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 border-t border-white/15 py-5 transition hover:border-violet-300/35 sm:grid-cols-[5rem_1fr_auto]"
                >
                  <span className="text-xs text-white/25">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-serif text-3xl text-white transition group-hover:text-violet-100 sm:text-5xl">{artist}</span>
                  <span className="text-xs uppercase tracking-[0.12em] text-white/35">
                    {count} {count === 1 ? "work" : "works"}
                  </span>
                </div>
              ))
            ) : (
              <div className="border-t border-white/15 py-8 text-sm text-white/35">
                Artist profiles will appear with published works.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid min-h-[58svh] w-full max-w-[94rem] items-center gap-12 overflow-hidden px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-12">
        <div className="pointer-events-none absolute -bottom-32 left-[18%] h-80 w-80 rounded-full bg-violet-700/10 blur-[120px]" />
        <div className="relative">
          <p className="text-[0.68rem] uppercase tracking-[0.25em] text-white/38">For artists & curators</p>
          <h2 className="mt-6 max-w-2xl font-serif text-6xl leading-[0.9] tracking-[-0.05em] text-white sm:text-8xl">
            Publish once.
            <span className="block bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">
              Exhibit anywhere.
            </span>
          </h2>
        </div>
        <div className="relative lg:pl-16">
          <p className="max-w-md text-base leading-7 text-white/45">
            Upload the artwork and its AR layer, then place its QR beside the physical work.
          </p>
          <Link
            href="/create"
            className="mt-10 inline-flex items-center gap-3 bg-white px-6 py-4 text-xs font-medium uppercase tracking-[0.14em] text-black transition hover:bg-violet-100"
          >
            Publish a work <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-[94rem] items-end justify-between border-t border-white/10 px-5 py-7 text-xs uppercase tracking-[0.14em] text-white/30 sm:px-8 lg:px-12">
        <span>Everie · Web AR gallery</span>
        <span>2026</span>
      </footer>
    </main>
  );
}
