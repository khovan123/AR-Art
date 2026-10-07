"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  collectArtwork,
  getCurrentCollectionUser,
} from "@/features/collection/infrastructure/supabase/collection-repository";

export function CollectScanEntry({
  artworkId,
  ownerId,
}: {
  artworkId: string;
  ownerId: string | null;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    let hideTimer: number | null = null;

    async function collectFromScan() {
      const user = await getCurrentCollectionUser();
      if (!active || !user || (ownerId && user.id === ownerId)) return;

      const result = await collectArtwork(artworkId);
      if (!active || !result.collected) return;

      setSaved(true);
      hideTimer = window.setTimeout(() => {
        if (active) setSaved(false);
      }, 3200);
    }

    void collectFromScan().catch(() => {
      // Collection is additive convenience. The public artwork remains viewable
      // even if saving fails or the visitor is signed out.
    });

    return () => {
      active = false;
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [artworkId, ownerId]);

  if (!saved) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 border border-cyan-100/20 bg-black/82 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
      <CheckCircle2 className="size-4 shrink-0 text-cyan-100" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">Added to your collection</p>
        <p className="mt-0.5 text-xs text-white/42">This work was saved from your scan.</p>
      </div>
    </div>
  );
}