"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

import { getCurrentCollectionUser } from "@/features/collection/infrastructure/supabase/collection-repository";

export function SiteHeader() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void getCurrentCollectionUser()
      .then((user) => {
        if (active) setAuthenticated(Boolean(user));
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-[94rem] items-center justify-between border-b border-white/10 px-5 py-5 text-white sm:px-8 lg:px-12">
      <Link href="/" className="flex items-baseline gap-3">
        <span className="text-xl font-semibold tracking-[-0.05em]">EVERIE</span>
        <span className="hidden text-[0.62rem] uppercase tracking-[0.22em] text-white/35 sm:inline">
          Art in another layer
        </span>
      </Link>

      <nav className="flex items-center gap-5 text-xs font-medium uppercase tracking-[0.12em] sm:gap-7">
        <Link href="/#works" className="hidden text-white/50 transition hover:text-white sm:inline">
          Works
        </Link>
        <Link href="/#artists" className="hidden text-white/50 transition hover:text-white md:inline">
          Artists
        </Link>
        <Link href="/collection" className="text-white/50 transition hover:text-white">
          Collection
        </Link>
        {authenticated === true ? (
          <Link href="/studio" className="text-white/50 transition hover:text-white">
            Studio
          </Link>
        ) : authenticated === false ? (
          <Link href="/login" className="text-white/50 transition hover:text-white">
            Sign in
          </Link>
        ) : null}
        <Link
          href={authenticated === false ? "/login?next=%2Fcreate" : "/create"}
          className="inline-flex items-center gap-2 border-b border-white/75 pb-1 text-white transition hover:border-cyan-200"
        >
          Publish <ArrowUpRight className="size-3.5" />
        </Link>
      </nav>
    </header>
  );
}
