"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, LogIn, LogOut, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/atoms/button";
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

        setUserEmail(user.email ?? "Tài khoản Everie");
        const artworkIds = await listCollectedArtworkIds();
        if (active) setCollectedArtworkIds(artworkIds);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Không thể tải Collection.");
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

  const collected = useMemo(
    () => new Set(collectedArtworkIds),
    [collectedArtworkIds],
  );

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login?next=/collection");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] px-6 py-16 text-center text-sm text-white/45">
        Đang tải Collection…
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] px-6 py-14 text-center">
        <Lock className="mx-auto size-7 text-white/35" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-medium">Đăng nhập để mở Collection</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/42">
          Bộ sưu tập được lưu theo tài khoản Everie trên cloud. Bạn cần đăng nhập trước khi quét và thu thập sản phẩm.
        </p>
        <Link href="/login?next=/collection" className="mt-6 inline-block">
          <Button className="bg-white text-black hover:bg-white/90">
            <LogIn className="size-4" aria-hidden="true" />
            Đăng nhập / Tạo tài khoản
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/30">Đang đăng nhập</p>
          <p className="mt-1 text-sm text-white/65">{userEmail}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void signOut()}
          className="border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          Đăng xuất
        </Button>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-300/15 bg-red-300/[0.06] px-4 py-3 text-sm text-red-100/75">
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {artworks.map((artwork, index) => {
          const isCollected = collected.has(artwork.id);
          const card = (
            <article
              className={`group relative overflow-hidden rounded-[1.8rem] border bg-white/[0.035] transition duration-500 ${
                isCollected
                  ? "border-white/14 hover:-translate-y-1 hover:border-white/25"
                  : "border-white/[0.07]"
              }`}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0f]">
                {/* Supabase public storage domain is runtime-configured. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artwork.targetImageUrl}
                  alt={isCollected ? artwork.title : "Locked Everie collectible"}
                  className={`h-full w-full object-cover transition duration-700 ${
                    isCollected
                      ? "scale-[1.01] opacity-100 group-hover:scale-[1.045]"
                      : "scale-105 opacity-20 grayscale blur-[2px]"
                  }`}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                <div className="absolute left-4 top-4 flex size-8 items-center justify-center rounded-full border border-white/15 bg-black/35 text-[0.65rem] text-white/60 backdrop-blur">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div
                  className={`absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.66rem] font-medium uppercase tracking-[0.12em] backdrop-blur ${
                    isCollected
                      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                      : "border-white/12 bg-black/35 text-white/55"
                  }`}
                >
                  {isCollected ? (
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Lock className="size-3.5" aria-hidden="true" />
                  )}
                  {isCollected ? "Collected" : "Locked"}
                </div>

                {!isCollected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex size-16 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/45 backdrop-blur-md">
                      <Lock className="size-6" aria-hidden="true" />
                    </div>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-white/35">
                    Everie digital collectible
                  </p>
                  <h2 className="mt-2 text-xl font-medium tracking-tight text-white">
                    {isCollected ? artwork.title : "Chưa mở khóa"}
                  </h2>
                  <p className="mt-1 line-clamp-1 text-sm text-white/42">
                    {isCollected
                      ? artwork.artistName
                      : "Quét sản phẩm Everie tương ứng để mở khóa."}
                  </p>
                </div>
              </div>
            </article>
          );

          return isCollected ? (
            <Link key={artwork.id} href={`/art/${artwork.slug}`} className="block">
              {card}
            </Link>
          ) : (
            <div key={artwork.id}>{card}</div>
          );
        })}

        {artworks.length === 0 && (
          <div className="col-span-full rounded-[2rem] border border-dashed border-white/10 bg-white/[0.025] px-6 py-16 text-center">
            <Sparkles className="mx-auto size-6 text-white/35" aria-hidden="true" />
            <p className="mt-4 text-sm text-white/55">
              Chưa có sản phẩm Everie nào được xuất bản.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
