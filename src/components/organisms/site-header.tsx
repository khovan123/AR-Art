import Link from "next/link";
import { ScanLine } from "lucide-react";

import { Button } from "@/components/atoms/button";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:px-8">
      <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
        <span className="flex size-9 items-center justify-center rounded-2xl bg-foreground text-background">
          <ScanLine className="size-4" aria-hidden="true" />
        </span>
        AR Art
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/demo-target" className="hidden sm:block">
          <Button variant="ghost">Demo target</Button>
        </Link>
        <Link href="/ar">
          <Button>Launch AR</Button>
        </Link>
      </div>
    </header>
  );
}
