"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Lock, LogOut } from "lucide-react";

import type { PublishedArtwork } from "@/features/artwork/domain/artwork";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import {
  getCurrentCollectionUser,
  listCollectedArtworkIds,
} from "@/features/collection/infrastructure/supabase/collection-repository";

interface CollectionGridProps {
  artworks: PublishedArtwork[];
}

export function CollectionGrid({ artworks }: CollectionGridProps) {
  const router = useRouter();
  const [collectedArtworkIds, setCollectedArtworkIds] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCollection() {
      try {
        const user = await getCurrentCollectionUser();
        if (!active) return;

        if (!user) {
          setUserEmail(null);
          setCollectedArtworkIds([]);
          return;
        }

        setUserEmail(user.email ?? "Everie account");
        const artworkIds = await listCollectedArtworkIds();
        if (active) setCollectedArtworkIds(artworkIds);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Unable to load your collection.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCollection();
    return () => {
      active = false;
    };
  }, []);

  const collected = useMemo(() => new Set(collectedArtworkIds), [collectedArtworkIds]);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login?next=/collection");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="border-y border-white/12 py-10 text-xs uppercase tracking-[0.16em] text-white/30">
        Loading your archive…
      </div>
    );
  }

  if (!userEmail) {
    return (
      <section className="grid min-h-[28rem] items-center border-y border-white/12 py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="hidden lg:block">
          <span className="text-[0.68rem] uppercase tracking-[0.22em] text-white/30">Private archive</span>
        </div>
        <div className="max-w-2xl">
          <Lock className="size-5 text-white/30" aria-hidden="true" />
          <h2 className="mt-6 font-serif text-5xl leading-[0.95] tracking-[-0.045em] sm:text-6xl">
            Sign in to see<br /><span className="text-violet-100 italic">your archive.</span>
          </h2>
          <Link
            href="/login?next=/collection"
            className="mt-9 inline-flex items-center gap-3 bg-white px-6 py-4 text-xs font-medium uppercase tracking-[0.14em] text-black transition hover:bg-violet-100"
          >
            Sign in <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-y border-white/12 py-4">
        <div className="flex items-baseline gap-4">
          <span className="text-[0.62rem] uppercase tracking-[0.18em] text-white/28">Signed in</span>
          <span className="text-sm text-white/58">{userEmail}</span>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/38 transition hover:text-white"
        >
          <LogOut className="size-3.5" /> Sign out
        </button>
      </div>

      {error ? (
        <div className="mb-8 border-l-2 border-rose-300/60 py-1 pl-4 text-sm text-rose-200/80">{error}</div>
      ) : null}

      <div className="grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {artworks.map((artwork, index) => {
          const isCollected = collected.has(artwork.id);
          const content = (
            <article className={`group ${index % 3 === 1 ? "lg:mt-12" : ""}`}>
              <div className="relative overflow-hidden border border-white/8 bg-[#0a0a0d]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artwork.targetImageUrl}
                  alt={isCollected ? artwork.title : "Locked Everie work"}
                  className={`aspect-[4/5] w-full object-cover transition duration-700 ${
                    isCollected
                      ? "opacity-90 group-hover:scale-[1.02] group-hover:opacity-100"
                      : "scale-[1.015] grayscale opacity-12"
                  }`}
                />
                {!isCollected ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/32 backdrop-blur-[1px]">
                    <Lock className="size-5 text-white/28" />
                  </div>
                ) : (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-950/20 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                )}
                <div className="absolute left-4 top-4 text-[0.62rem] tabular-nums tracking-[0.14em] text-white/65">
                  {String(index + 1).padStart(2, "0")}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-[1fr_auto] gap-5 border-t border-white/12 pt-3">
                <div>
                  <div className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.15em] text-white/30">
                    {isCollected ? <Check className="size-3 text-cyan-100/55" /> : <Lock className="size-3" />}
                    {isCollected ? "Collected" : "Locked"}
                  </div>
                  <h2 className="mt-2 font-serif text-2xl leading-none text-white">
                    {isCollected ? artwork.title : "Unrevealed work"}
                  </h2>
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-white/35">
                    {isCollected ? artwork.artistName : "Scan to unlock"}
                  </p>
                </div>
                {isCollected ? <ArrowUpRight className="mt-1 size-4 text-white/35 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-100" /> : null}
              </div>
            </article>
          );

          return isCollected ? (
            <Link key={artwork.id} href={`/art/${artwork.slug}`} className="block">{content}</Link>
          ) : (
            <div key={artwork.id}>{content}</div>
          );
        })}

        {artworks.length === 0 ? (
          <div className="col-span-full border-y border-white/12 py-16 text-sm text-white/35">
            No published works yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
