import Link from "next/link";
import { Plus, ScanLine } from "lucide-react";

import { Button } from "@/components/atoms/button";

export function SiteHeader() {
  return (
    <header className="relative z-30 mx-auto flex w-full max-w-[90rem] items-center justify-between px-5 py-5 text-white lg:px-10">
      <Link
        href="/"
        className="group flex items-center gap-3 text-sm font-medium tracking-[0.02em]"
      >
        <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-white/[0.055]">
          <span className="absolute inset-0 bg-gradient-to-br from-violet-400/20 to-cyan-300/10 opacity-0 transition group-hover:opacity-100" />
          <ScanLine className="relative size-4 text-white/85" aria-hidden="true" />
        </span>
        <span>AR/ART</span>
      </Link>

      <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 backdrop-blur-xl">
        <Link href="/demo-target" className="hidden md:block">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/55 hover:bg-white/[0.07] hover:text-white"
          >
            Demo
          </Button>
        </Link>
        <Link href="/ar" className="hidden sm:block">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/55 hover:bg-white/[0.07] hover:text-white"
          >
            Scan
          </Button>
        </Link>
        <Link href="/create">
          <Button
            size="sm"
            className="bg-white text-black hover:bg-white/88"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Create
          </Button>
        </Link>
      </nav>
    </header>
  );
}
