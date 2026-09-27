import { Aperture, Box, ScanLine } from "lucide-react";

import { LandingHero } from "@/components/organisms/landing-hero";
import { SiteHeader } from "@/components/organisms/site-header";

const moments = [
  {
    number: "01",
    icon: Aperture,
    title: "Capture the artwork",
    description:
      "Upload the physical piece once. AR Art converts it into a visual tracking target automatically.",
  },
  {
    number: "02",
    icon: Box,
    title: "Add the digital layer",
    description:
      "Pair the artwork with motion, video, or spatial content designed to break beyond the frame.",
  },
  {
    number: "03",
    icon: ScanLine,
    title: "Let visitors discover it",
    description:
      "Place the generated QR beside the piece. Any phone becomes the lens into the hidden layer.",
  },
];

export function MarketingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060608] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(111,66,193,0.16),transparent_28%),radial-gradient(circle_at_85%_24%,rgba(55,170,185,0.12),transparent_27%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.17] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:80px_80px]" />

      <div className="relative z-10">
        <SiteHeader />
        <LandingHero />

        <section className="mx-auto w-full max-w-[90rem] px-5 pb-28 pt-12 lg:px-10">
          <div className="grid gap-6 border-t border-white/10 pt-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-white/35">
                The exhibition flow
              </p>
              <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                From static canvas to spatial experience.
              </h2>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 md:grid-cols-3">
              {moments.map(({ number, icon: Icon, title, description }) => (
                <article
                  key={number}
                  className="group relative min-h-64 bg-[#0a0a0d] p-6 transition duration-500 hover:bg-white/[0.055]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs tracking-[0.22em] text-white/25">{number}</span>
                    <Icon className="size-4 text-white/40 transition group-hover:text-cyan-200" />
                  </div>
                  <div className="mt-20">
                    <h3 className="text-lg font-medium text-white">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/45">{description}</p>
                  </div>
                  <div className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 transition duration-500 group-hover:scale-x-100" />
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
