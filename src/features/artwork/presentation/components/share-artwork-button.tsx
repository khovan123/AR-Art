"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { Button } from "@/components/atoms/button";

interface ShareArtworkButtonProps {
  title: string;
  text?: string;
}

export function ShareArtworkButton({ title, text }: ShareArtworkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function shareArtwork() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Native share can be cancelled by the user; no error UI is required.
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={shareArtwork}
      className="border-white/12 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white"
    >
      {copied ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Share2 className="size-4" aria-hidden="true" />
      )}
      {copied ? "Copied" : "Share"}
    </Button>
  );
}
