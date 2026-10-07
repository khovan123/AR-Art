import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ImageIcon,
  Layers3,
  QrCode,
  ScanLine,
  Sparkles,
  Video,
} from "lucide-react";

import { EverieBrand } from "@/components/atoms/everie-brand";
import { ImmersiveGalleryShowcase } from "@/components/organisms/immersive-gallery-showcase";
import { SiteHeader } from "@/components/organisms/site-header";
import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";

const CAPABILITIES = [
  "Animated artwork",
  "Transparent motion",
  "Layered AR",
  "QR entry",
  "Browser camera",
  "Recognition unlock",
  "Personal collection",
];

const EXPERIENCE_STEPS = [
  {
    number: "01",
    title: "Start with the physical work",
    text: "Upload the artwork visitors will stand in front of. It becomes the visual target for the AR experience.",
    outcome: "One clear target for the camera to recognize.",
    icon: ImageIcon,
  },
  {
    number: "02",
    title: "Build its digital layer",
    text: "Choose motion extracted from the artwork, a transparent animation, or separate spatial layers.",
    outcome: "The AR treatment stays tied to the work, not the page around it.",
    icon: Layers3,
  },
  {
    number: "03",
    title: "Put the QR beside the work",
    text: "Publishing creates an AR entry link and QR that opens the camera directly in the browser.",
    outcome: "No app install between the visitor and the exhibition.",
    icon: QrCode,
  },
  {
    number: "04",
    title: "Recognition is the unlock",
    text: "Opening the link is not enough. The work joins a visitor’s Collection only after the AR target is actually recognized.",
    outcome: "A collection records real discoveries, not page visits.",
    icon: ScanLine,
  },
];

const AR_MODES = [
  {
    title: "Animate the artwork",
    label: "Motion extract",
    text: "Reveal only what moves from a full artwork animation.",
    icon: Sparkles,
  },
  {
    title: "Add transparent motion",
    label: "Overlay",
    text: "Place prepared motion directly over the physical piece.",
    icon: Video,
  },
  {
    title: "Compose in depth",
    label: "Spatial layers",
    text: "Arrange images, video and 3D elements as separate AR layers.",
    icon: Layers3,
  },
];

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
    <main className="everie-page min-h-screen overflow-hidden bg-[#030305] text-white">
      <div className="relative border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(124,58,237,0.18),transparent_35%),radial-gradient(circle_at_88%_58%,rgba(34,211,238,0.1),transparent_28%)]" />
        <SiteHeader />

        <section className="relative mx-auto grid min-h-[94svh] w-full max-w-[94rem] items-end gap-10 px-5 pb-10 pt-28 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:px-12 lg:pb-16 lg:pt-32">
          <div className="everie-hero-copy relative z-10 pb-3">
            <div className="inline-flex items-center gap-2 border border-violet-300/20 bg-violet-400/[0.07] px-3 py-2">
              <span className="size-1.5 bg-violet-300" />
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-violet-100/65">
                Digital art · Browser AR
              </p>
            </div>

            <h1 className="mt-7 font-serif text-[clamp(4rem,9.5vw,9rem)] font-normal leading-[0.79] tracking-[-0.072em]">
              Art,
              <span className="block bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text italic text-transparent">
                beyond
              </span>
              <span className="block">the frame.</span>
            </h1>

            <p className="mt-8 max-w-lg text-base leading-7 text-white/56 sm:text-lg sm:leading-8">
              Turn a physical artwork into a digital layer visitors can unlock with the camera already in their browser.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link
                href="#works"
                className="inline-flex h-12 items-center gap-3 bg-white px-5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-violet-100"
              >
                Explore works <ArrowDownRight className="size-4" />
              </Link>
              <Link
                href="/create"
                className="inline-flex h-12 items-center gap-3 border border-white/18 bg-white/[0.035] px-5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/68 transition hover:border-white/38 hover:bg-white/[0.07] hover:text-white"
              >
                Publish a work <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 border-y border-white/12 py-4">
              {[
                ["01", "Open in browser"],
                ["02", "Point at the work"],
                ["03", "Recognition unlocks"],
              ].map(([number, label]) => (
                <div key={number} className="border-r border-white/10 px-3 first:pl-0 last:border-r-0 last:pr-0">
                  <p className="text-[0.58rem] tabular-nums text-white/24">{number}</p>
                  <p className="mt-1 text-[0.6rem] uppercase leading-4 tracking-[0.1em] text-white/45">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="everie-hero-visual relative min-h-[36rem] overflow-hidden border border-white/10 bg-black lg:min-h-[46rem]">
            <ImmersiveGalleryShowcase />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_50%,transparent_22%,rgba(0,0,0,0.16)_58%,rgba(0,0,0,0.78)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#030305] via-[#030305]/35 to-transparent" />

            {featured ? (
              <Link
                href={`/art/${featured.slug}`}
                className="group absolute bottom-6 right-5 z-10 w-[44%] min-w-44 max-w-[17rem] sm:bottom-8 sm:right-8"
              >
                <div className="relative border border-white/18 bg-black/72 p-2 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl transition duration-500 group-hover:-translate-y-1 group-hover:border-violet-200/40">
                  <div className="relative aspect-square overflow-hidden bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featured.targetImageUrl}
                      alt={featured.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3.5">
                      <p className="text-[0.55rem] uppercase tracking-[0.2em] text-white/42">Now showing</p>
                      <p className="mt-1 truncate font-serif text-xl text-white">{featured.title}</p>
                      <p className="mt-1 truncate text-[0.68rem] text-white/45">{featured.artistName}</p>
                    </div>
                  </div>
                </div>
                <span className="absolute -right-2 -top-2 flex size-10 items-center justify-center border border-white/20 bg-white text-black transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
            ) : null}

            <div className="absolute left-5 top-5 z-10 flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.19em] text-white/45 sm:left-7 sm:top-7">
              <span className="size-1.5 animate-pulse bg-cyan-300" />
              Live spatial scene
            </div>
          </div>
        </section>
      </div>

      <section className="everie-capability-strip border-b border-white/10 bg-[#07070a]" aria-label="Everie capabilities">
        <p className="sr-only">{CAPABILITIES.join(", ")}</p>
        <div className="overflow-hidden py-4" aria-hidden="true">
          <div className="everie-marquee-track flex w-max items-center">
            {[...CAPABILITIES, ...CAPABILITIES].map((capability, index) => (
              <span key={`${capability}-${index}`} className="flex items-center">
                <span className="px-5 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-white/42 sm:px-8">
                  {capability}
                </span>
                <span className="size-1 bg-violet-300/60" />
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="everie-section relative border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(76,29,149,0.12)_45%,transparent)]" />
        <div className="relative mx-auto w-full max-w-[94rem] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.38fr_1.62fr]">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.25em] text-violet-200/48">01 · How it works</p>
              <p className="mt-4 max-w-xs text-sm leading-6 text-white/40">
                One physical work, one AR entry, one recognition event that makes the discovery real.
              </p>
            </div>
            <div>
              <h2 className="max-w-4xl font-serif text-5xl leading-[0.9] tracking-[-0.048em] sm:text-7xl lg:text-8xl">
                From wall to
                <span className="block bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">
                  living layer.
                </span>
              </h2>

              <div className="mt-12 grid gap-4 lg:grid-cols-2 lg:gap-5">
                {EXPERIENCE_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <article
                      key={step.number}
                      className={`group relative min-h-[19rem] overflow-hidden border border-violet-300/15 bg-[linear-gradient(155deg,rgba(76,29,149,0.34),rgba(10,7,18,0.92)_58%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] transition duration-500 hover:border-violet-200/30 lg:p-7 ${index % 2 === 1 ? "lg:translate-y-10" : ""}`}
                    >
                      <div className="pointer-events-none absolute -right-20 -top-20 size-48 rounded-full bg-violet-400/10 blur-[70px]" />
                      <div className="relative flex items-start justify-between gap-6">
                        <span className="flex size-10 items-center justify-center border border-violet-200/20 bg-violet-200/10 text-[0.62rem] font-semibold tracking-[0.12em] text-violet-100">
                          {step.number}
                        </span>
                        <Icon className="size-5 text-white/35 transition group-hover:text-violet-100/75" />
                      </div>
                      <h3 className="relative mt-10 font-serif text-3xl leading-[0.95] tracking-[-0.03em] text-white">
                        {step.title}
                      </h3>
                      <p className="relative mt-4 max-w-md text-sm leading-6 text-white/48">{step.text}</p>
                      <p className="relative mt-6 border-t border-white/10 pt-4 text-xs leading-5 text-violet-100/62">
                        {step.outcome}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="works" className="everie-section relative mx-auto w-full max-w-[94rem] border-b border-white/10 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="pointer-events-none absolute left-[28%] top-12 h-72 w-72 rounded-full bg-violet-600/5 blur-[100px]" />
        <div className="relative grid gap-8 lg:grid-cols-[0.35fr_1.65fr]">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.25em] text-white/38">02 · Selected works</p>
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

      <section className="everie-section relative border-b border-white/10 bg-[#050509]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_38%,rgba(76,29,149,0.2),transparent_30%),radial-gradient(circle_at_86%_72%,rgba(8,145,178,0.08),transparent_24%)]" />
        <div className="relative mx-auto grid w-full max-w-[94rem] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.62fr_1.38fr] lg:px-12 lg:py-28">
          <div className="relative z-10">
            <p className="text-[0.68rem] uppercase tracking-[0.25em] text-white/38">03 · The AR layer</p>
            <h2 className="mt-6 max-w-xl font-serif text-5xl leading-[0.92] tracking-[-0.045em] sm:text-7xl">
              Choose how the work
              <span className="block bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">
                comes alive.
              </span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-6 text-white/42">
              The creation flow stays focused: define the target, choose the AR treatment, preview it, then publish.
            </p>
            <Link
              href="/create"
              className="mt-9 inline-flex items-center gap-3 border-b border-white/45 pb-2 text-xs uppercase tracking-[0.16em] text-white/70 transition hover:border-cyan-200 hover:text-white"
            >
              Open creator studio <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="relative border border-white/10 bg-[#09090d]/96 shadow-[0_45px_140px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#07070a] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-rose-300/70" />
                <span className="size-2.5 rounded-full bg-amber-200/70" />
                <span className="size-2.5 rounded-full bg-emerald-300/70" />
              </div>
              <p className="text-[0.58rem] uppercase tracking-[0.18em] text-white/28">Everie / Create</p>
            </div>

            <div className="grid min-h-[34rem] sm:grid-cols-[8.5rem_1fr]">
              <aside className="hidden border-r border-white/10 bg-black/20 p-4 sm:block">
                <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/25">Workflow</p>
                <div className="mt-6 space-y-1 text-xs">
                  {["Details", "Artwork", "AR layer", "Publish"].map((item) => (
                    <div
                      key={item}
                      className={`border-l-2 px-3 py-2.5 ${item === "AR layer" ? "border-violet-300 bg-violet-300/8 text-white" : "border-transparent text-white/30"}`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </aside>

              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-[0.58rem] uppercase tracking-[0.17em] text-violet-100/50">AR experience</p>
                    <h3 className="mt-2 font-serif text-3xl tracking-[-0.03em]">Select a rendering mode</h3>
                  </div>
                  <span className="border border-white/10 px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.15em] text-white/35">Preview ready</span>
                </div>

                <div className="mt-5 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-3">
                  {AR_MODES.map((mode, index) => {
                    const Icon = mode.icon;
                    return (
                      <div key={mode.title} className={`min-h-52 bg-[#0b0b0f] p-5 ${index === 0 ? "ring-1 ring-inset ring-violet-300/35" : ""}`}>
                        <Icon className={`size-5 ${index === 0 ? "text-violet-100" : "text-white/35"}`} />
                        <p className="mt-8 text-[0.55rem] uppercase tracking-[0.15em] text-white/28">{mode.label}</p>
                        <p className="mt-2 font-serif text-xl leading-none text-white/88">{mode.title}</p>
                        <p className="mt-3 text-xs leading-5 text-white/36">{mode.text}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-4 border border-cyan-200/10 bg-cyan-200/[0.035] p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <div className="flex size-10 items-center justify-center border border-cyan-100/15 text-cyan-100/65">
                    <ScanLine className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/75">Collection unlocks on recognition</p>
                    <p className="mt-1 text-xs leading-5 text-white/35">Opening the product or QR does not collect it.</p>
                  </div>
                  <span className="text-[0.55rem] uppercase tracking-[0.16em] text-cyan-100/45">targetFound</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="artists" className="everie-section mx-auto w-full max-w-[94rem] border-b border-white/10 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[0.35fr_1.65fr]">
          <p className="text-[0.68rem] uppercase tracking-[0.25em] text-white/38">04 · Artists</p>
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

      <section className="everie-section relative mx-auto grid min-h-[58svh] w-full max-w-[94rem] items-center gap-12 overflow-hidden px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-28">
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
        <div className="relative border-l border-white/12 pl-6 lg:ml-10 lg:pl-10">
          <p className="max-w-md text-base leading-7 text-white/45">
            Upload the artwork and its AR layer, then place its QR beside the physical work. Visitors only collect what the camera truly recognizes.
          </p>
          <Link
            href="/create"
            className="mt-10 inline-flex items-center gap-3 bg-white px-6 py-4 text-xs font-medium uppercase tracking-[0.14em] text-black transition hover:bg-violet-100"
          >
            Publish a work <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#050507]">
        <div className="mx-auto grid w-full max-w-[94rem] gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr] lg:px-12">
          <div>
            <EverieBrand className="opacity-90" />
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/34">
              Physical art with a browser-based layer for motion, depth and real-world discovery.
            </p>
          </div>
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.18em] text-white/28">Explore</p>
            <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/42">
              <Link href="#works" className="transition hover:text-white">Works</Link>
              <Link href="#artists" className="transition hover:text-white">Artists</Link>
              <Link href="/collection" className="transition hover:text-white">Collection</Link>
            </div>
          </div>
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.18em] text-white/28">Create</p>
            <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/42">
              <Link href="/create" className="transition hover:text-white">Publish a work</Link>
              <Link href="/studio" className="transition hover:text-white">Studio</Link>
              <Link href="/login" className="transition hover:text-white">Account</Link>
            </div>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[94rem] items-end justify-between border-t border-white/8 px-5 py-6 text-[0.6rem] uppercase tracking-[0.14em] text-white/24 sm:px-8 lg:px-12">
          <span>Everie · Web AR gallery</span>
          <span>2026</span>
        </div>
      </footer>
    </main>
  );
}
