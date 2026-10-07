"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

import { getCurrentCollectionUser } from "@/features/collection/infrastructure/supabase/collection-repository";

export function SiteHeader() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 36);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 text-white transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled
          ? "border-b border-white/10 bg-[#030305]/92 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[94rem] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-baseline gap-3" aria-label="Everie home">
          <span className="text-lg font-semibold tracking-[-0.05em] sm:text-xl">EVERIE</span>
          <span className="hidden text-[0.58rem] uppercase tracking-[0.2em] text-white/32 lg:inline">
            Art in another layer
          </span>
        </Link>

        <nav className="flex items-center gap-3 text-[0.6rem] font-medium uppercase tracking-[0.1em] sm:gap-5 sm:text-[0.65rem] sm:tracking-[0.12em] lg:gap-7">
          <Link href="/#how-it-works" className="hidden text-white/46 transition hover:text-white md:inline">
            How it works
          </Link>
          <Link href="/#works" className="hidden text-white/46 transition hover:text-white sm:inline">
            Works
          </Link>
          <Link href="/#artists" className="hidden text-white/46 transition hover:text-white lg:inline">
            Artists
          </Link>
          <Link href="/collection" className="text-white/46 transition hover:text-white">
            Collection
          </Link>
          {authenticated === true ? (
            <Link href="/studio" className="text-white/46 transition hover:text-white">
              Studio
            </Link>
          ) : authenticated === false ? (
            <Link href="/login" className="text-white/46 transition hover:text-white">
              Sign in
            </Link>
          ) : null}
          <Link
            href={authenticated === false ? "/login?next=%2Fcreate" : "/create"}
            className="inline-flex h-10 items-center gap-2 bg-white px-3.5 text-black transition hover:bg-violet-100 sm:px-4"
          >
            Publish <ArrowUpRight className="size-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
