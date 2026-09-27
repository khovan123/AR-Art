import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Button } from "@/components/atoms/button";
import { arConfig } from "@/config/ar";

export default function DemoTargetPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-6 text-white sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <ArrowLeft className="size-4" aria-hidden="true" /> Home
            </Button>
          </Link>
          <p className="text-xs text-white/45">Use your browser print menu if you want a physical target.</p>
        </div>

        <section className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-sm font-medium text-white/55">MindAR sample target</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Scan this image with the AR camera.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/60">
            Open this page on a laptop or second phone, then open the AR camera on your test device. Replace this sample with your own artwork before production.
          </p>

          <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white p-5 shadow-2xl">
            {/* External img is intentional: this target is the exact image used by the default .mind file. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={arConfig.targetImageUrl} alt="MindAR demo image target" className="mx-auto h-auto w-full" />
          </div>

          <a
            href={arConfig.targetImageUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            Open original target <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </section>
      </div>
    </main>
  );
}
