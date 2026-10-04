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
      <div className="border-y border-black/20 py-10 text-xs uppercase tracking-[0.16em] text-black/38">
        Loading your archive…
      </div>
    );
  }

  if (!userEmail) {
    return (
      <section className="grid min-h-[28rem] items-center border-y border-black/20 py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="hidden lg:block">
          <span className="text-[0.68rem] uppercase tracking-[0.22em] text-black/38">Private archive</span>
        </div>
        <div className="max-w-2xl">
          <Lock className="size-5 text-black/35" aria-hidden="true" />
          <h2 className="mt-6 font-serif text-5xl leading-[0.95] tracking-[-0.045em] sm:text-6xl">
            Sign in to see<br /><span className="italic">your archive.</span>
          </h2>
          <p className="mt-6 max-w-md text-sm leading-6 text-black/48">
            Works you unlock are saved to your Everie account.
          </p>
          <Link
            href="/login?next=/collection"
            className="mt-9 inline-flex items-center gap-3 bg-[#11110f] px-6 py-4 text-xs font-medium uppercase tracking-[0.14em] text-[#efeee8] transition hover:bg-black/85"
          >
            Sign in <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-y border-black/20 py-4">
        <div className="flex items-baseline gap-4">
          <span className="text-[0.62rem] uppercase tracking-[0.18em] text-black/35">Signed in</span>
          <span className="text-sm text-black/65">{userEmail}</span>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-black/45 transition hover:text-black"
        >
          <LogOut className="size-3.5" /> Sign out
        </button>
      </div>

      {error ? (
        <div className="mb-8 border-l-2 border-red-700 py-1 pl-4 text-sm text-red-900/70">{error}</div>
      ) : null}

      <div className="grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {artworks.map((artwork, index) => {
          const isCollected = collected.has(artwork.id);
          const content = (
            <article className={`group ${index % 3 === 1 ? "lg:mt-12" : ""}`}>
              <div className="relative overflow-hidden bg-[#d9d8d1]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artwork.targetImageUrl}
                  alt={isCollected ? artwork.title : "Locked Everie work"}
                  className={`aspect-[4/5] w-full object-cover transition duration-700 ${
                    isCollected
                      ? "opacity-100 group-hover:scale-[1.02]"
                      : "scale-[1.015] grayscale opacity-16"
                  }`}
                />
                {!isCollected ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#efeee8]/35">
                    <Lock className="size-5 text-black/35" />
                  </div>
                ) : null}
                <div className="absolute left-4 top-4 text-[0.62rem] tabular-nums tracking-[0.14em] text-white/70 mix-blend-difference">
                  {String(index + 1).padStart(2, "0")}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-[1fr_auto] gap-5 border-t border-black/20 pt-3">
                <div>
                  <div className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.15em] text-black/38">
                    {isCollected ? <Check className="size-3" /> : <Lock className="size-3" />}
                    {isCollected ? "Collected" : "Locked"}
                  </div>
                  <h2 className="mt-2 font-serif text-2xl leading-none">
                    {isCollected ? artwork.title : "Unrevealed work"}
                  </h2>
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-black/42">
                    {isCollected ? artwork.artistName : "Scan to unlock"}
                  </p>
                </div>
                {isCollected ? <ArrowUpRight className="mt-1 size-4 text-black/45 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-black" /> : null}
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
          <div className="col-span-full border-y border-black/20 py-16 text-sm text-black/45">
            No published works yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
