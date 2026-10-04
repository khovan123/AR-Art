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
    <header className="mx-auto flex w-full max-w-[94rem] items-center justify-between border-b border-black/15 px-5 py-5 text-[#11110f] sm:px-8 lg:px-12">
      <Link href="/" className="flex items-baseline gap-3">
        <span className="text-xl font-semibold tracking-[-0.05em]">EVERIE</span>
        <span className="hidden text-[0.62rem] uppercase tracking-[0.22em] text-black/42 sm:inline">Art in another layer</span>
      </Link>

      <nav className="flex items-center gap-5 text-xs font-medium uppercase tracking-[0.12em] sm:gap-7">
        <Link href="/#works" className="hidden text-black/55 transition hover:text-black sm:inline">Works</Link>
        <Link href="/#artists" className="hidden text-black/55 transition hover:text-black md:inline">Artists</Link>
        <Link href="/collection" className="text-black/55 transition hover:text-black">Collection</Link>
        {authenticated === true ? (
          <Link href="/studio" className="text-black/55 transition hover:text-black">Studio</Link>
        ) : authenticated === false ? (
          <Link href="/login" className="text-black/55 transition hover:text-black">Sign in</Link>
        ) : null}
        <Link
          href={authenticated === false ? "/login?next=%2Fcreate" : "/create"}
          className="inline-flex items-center gap-2 border-b border-black pb-1 text-black"
        >
          Publish <ArrowUpRight className="size-3.5" />
        </Link>
      </nav>
    </header>
  );
}
