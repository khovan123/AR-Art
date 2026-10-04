import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { ArtGalleryScene } from "@/components/organisms/art-gallery-scene";
import { AuthForm } from "@/features/auth/presentation/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="min-h-screen bg-[#efeee8] text-[#11110f]">
      <div className="mx-auto grid min-h-screen w-full max-w-[100rem] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden min-h-screen overflow-hidden bg-[#10100f] text-white lg:block">
          <div className="absolute inset-0 opacity-90"><ArtGalleryScene /></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/5 to-black/18" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-8 text-[0.65rem] uppercase tracking-[0.2em] text-white/55">
            <Link href="/" className="text-lg font-semibold tracking-[-0.04em] text-white">EVERIE</Link>
            <span>Private collection</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-white/50">Your archive</p>
            <h1 className="mt-5 max-w-2xl font-serif text-6xl leading-[0.88] tracking-[-0.05em] xl:text-8xl">
              Keep the works that found you.
            </h1>
            <p className="mt-7 max-w-md text-sm leading-6 text-white/55">
              Sign in once. Every artwork you unlock stays with your Everie collection.
            </p>
          </div>
        </section>

        <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20">
          <div className="flex items-center justify-between border-b border-black/15 pb-5">
            <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-black/55 transition hover:text-black">
              <ArrowLeft className="size-3.5" /> Back to gallery
            </Link>
            <span className="text-[0.62rem] uppercase tracking-[0.18em] text-black/35">Everie account</span>
          </div>

          <div className="flex flex-1 items-center py-14">
            <div className="w-full max-w-lg">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-black/42">Member access</p>
              <h2 className="mt-5 font-serif text-5xl leading-[0.94] tracking-[-0.045em] sm:text-6xl">
                Your collection,<br /><span className="italic">kept together.</span>
              </h2>
              <AuthForm nextPath={next} />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-black/15 pt-5 text-[0.62rem] uppercase tracking-[0.14em] text-black/35">
            <span>Web AR archive</span>
            <Link href="/collection" className="inline-flex items-center gap-2 transition hover:text-black">View collection <ArrowUpRight className="size-3" /></Link>
          </div>
        </section>
      </div>
    </main>
  );
}
