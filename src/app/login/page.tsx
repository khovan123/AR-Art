import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { ImmersiveGalleryShowcase } from "@/components/organisms/immersive-gallery-showcase";
import { AuthForm } from "@/features/auth/presentation/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[100rem] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden min-h-screen overflow-hidden border-r border-white/10 bg-[#030305] lg:block">
          <ImmersiveGalleryShowcase />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_35%,transparent_18%,rgba(3,3,5,0.28)_58%,rgba(3,3,5,0.9)_100%)]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-8 text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
            <Link href="/" className="text-lg font-semibold tracking-[-0.04em] text-white">EVERIE</Link>
            <span>Private collection</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-violet-200/55">Your archive</p>
            <h1 className="mt-5 max-w-2xl font-serif text-6xl leading-[0.88] tracking-[-0.05em] xl:text-8xl">
              Keep the works<br /><span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">that found you.</span>
            </h1>
          </div>
        </section>

        <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#050507] px-5 py-6 sm:px-10 lg:px-14 xl:px-20">
          <div className="pointer-events-none absolute -right-28 top-[18%] size-72 rounded-full bg-violet-700/8 blur-[120px]" />
          <div className="relative flex items-center justify-between border-b border-white/12 pb-5">
            <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/50 transition hover:text-white">
              <ArrowLeft className="size-3.5" /> Back to gallery
            </Link>
            <span className="text-[0.62rem] uppercase tracking-[0.18em] text-white/28">Everie account</span>
          </div>

          <div className="relative flex flex-1 items-center py-14">
            <div className="w-full max-w-lg">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/35">Member access</p>
              <h2 className="mt-5 font-serif text-5xl leading-[0.94] tracking-[-0.045em] sm:text-6xl">
                Your collection,<br /><span className="text-violet-100 italic">kept together.</span>
              </h2>
              <AuthForm nextPath={next} />
            </div>
          </div>

          <div className="relative flex items-center justify-between border-t border-white/12 pt-5 text-[0.62rem] uppercase tracking-[0.14em] text-white/28">
            <span>Web AR archive</span>
            <Link href="/collection" className="inline-flex items-center gap-2 transition hover:text-white">View collection <ArrowUpRight className="size-3" /></Link>
          </div>
        </section>
      </div>
    </main>
  );
}
