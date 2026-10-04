import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { ArtGalleryScene } from "@/components/organisms/art-gallery-scene";
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
    <main className="min-h-screen bg-[#efeee8] text-[#11110f]">
      <SiteHeader />

      <section className="mx-auto grid min-h-[78svh] w-full max-w-[94rem] items-end gap-10 px-5 pb-10 pt-14 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-12 lg:pb-16 lg:pt-20">
        <div className="pb-3">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-black/45">Digital art platform · AR exhibition</p>
          <h1 className="mt-6 font-serif text-[clamp(4.2rem,10vw,9.5rem)] font-normal leading-[0.78] tracking-[-0.075em]">
            Art,
            <span className="block italic">beyond</span>
            <span className="block">the frame.</span>
          </h1>
          <div className="mt-10 flex max-w-md items-end justify-between gap-8 border-t border-black/20 pt-4">
            <p className="text-sm leading-6 text-black/58">
              Physical works open into a digital layer through the browser. No app, no extra device.
            </p>
            <ArrowDownRight className="size-5 shrink-0" />
          </div>
        </div>

        <div className="relative min-h-[36rem] overflow-hidden bg-[#0c0c0b] lg:min-h-[43rem]">
          {featured ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.targetImageUrl} alt={featured.title} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 text-white sm:p-8">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-white/55">Featured work</p>
                  <p className="mt-2 font-serif text-3xl">{featured.title}</p>
                  <p className="mt-1 text-sm text-white/55">{featured.artistName}</p>
                </div>
                <Link href={`/art/${featured.slug}`} className="flex size-12 items-center justify-center border border-white/45 transition hover:bg-white hover:text-black" aria-label={`View ${featured.title}`}>
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </>
          ) : (
            <ArtGalleryScene />
          )}
        </div>
      </section>

      <section id="works" className="mx-auto w-full max-w-[94rem] border-t border-black/20 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.35fr_1.65fr]">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.25em] text-black/45">01 · Selected works</p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-black/50">A changing selection of works currently living in Everie.</p>
          </div>
          <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {selected.map((artwork, index) => (
              <Link key={artwork.id} href={`/art/${artwork.slug}`} className={`group block ${index === 1 || index === 4 ? "lg:mt-16" : ""}`}>
                <div className="overflow-hidden bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artwork.targetImageUrl} alt={artwork.title} className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
                </div>
                <div className="mt-4 flex items-start justify-between gap-4 border-t border-black/20 pt-3">
                  <div>
                    <h2 className="font-serif text-2xl leading-none">{artwork.title}</h2>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-black/45">{artwork.artistName}</p>
                  </div>
                  <span className="text-xs tabular-nums text-black/35">{String(index + 1).padStart(2, "0")}</span>
                </div>
              </Link>
            ))}
            {selected.length === 0 ? <p className="col-span-full border-t border-black/20 py-12 text-sm text-black/45">The first exhibition is being prepared.</p> : null}
          </div>
        </div>
      </section>

      <section className="bg-[#10100f] text-[#efeee8]">
        <div className="mx-auto grid w-full max-w-[94rem] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.6fr_1.4fr] lg:px-12 lg:py-24">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.25em] text-white/45">02 · Exhibition preview</p>
            <h2 className="mt-6 max-w-lg font-serif text-5xl leading-[0.95] tracking-[-0.04em] sm:text-7xl">Enter the work, not another interface.</h2>
            <Link href="/ar" className="mt-10 inline-flex items-center gap-3 border-b border-white/60 pb-2 text-xs uppercase tracking-[0.16em]">Open AR exhibition <ArrowUpRight className="size-4" /></Link>
          </div>
          <div className="min-h-[34rem] border border-white/12 bg-black lg:min-h-[42rem]">
            <ArtGalleryScene />
          </div>
        </div>
      </section>

      <section id="artists" className="mx-auto w-full max-w-[94rem] border-b border-black/20 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.35fr_1.65fr]">
          <p className="text-[0.68rem] uppercase tracking-[0.25em] text-black/45">03 · Artists</p>
          <div>
            {artists.length > 0 ? artists.map(([artist, count], index) => (
              <div key={artist} className="grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 border-t border-black/20 py-5 sm:grid-cols-[5rem_1fr_auto]">
                <span className="text-xs text-black/35">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-serif text-3xl sm:text-5xl">{artist}</span>
                <span className="text-xs uppercase tracking-[0.12em] text-black/40">{count} {count === 1 ? "work" : "works"}</span>
              </div>
            )) : <div className="border-t border-black/20 py-8 text-sm text-black/45">Artist profiles will appear with published works.</div>}
          </div>
        </div>
      </section>

      <section className="mx-auto grid min-h-[55svh] w-full max-w-[94rem] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-12">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.25em] text-black/45">For artists & curators</p>
          <h2 className="mt-6 max-w-2xl font-serif text-6xl leading-[0.9] tracking-[-0.05em] sm:text-8xl">Publish once. Exhibit anywhere.</h2>
        </div>
        <div className="lg:pl-16">
          <p className="max-w-md text-base leading-7 text-black/55">Upload the artwork and its AR layer, publish the piece, then place its QR beside the physical work.</p>
          <Link href="/create" className="mt-10 inline-flex items-center gap-3 bg-[#11110f] px-6 py-4 text-xs font-medium uppercase tracking-[0.14em] text-[#efeee8] transition hover:bg-black/85">Publish a work <ArrowUpRight className="size-4" /></Link>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-[94rem] items-end justify-between border-t border-black/20 px-5 py-7 text-xs uppercase tracking-[0.14em] text-black/45 sm:px-8 lg:px-12">
        <span>Everie · Web AR gallery</span><span>2026</span>
      </footer>
    </main>
  );
}
