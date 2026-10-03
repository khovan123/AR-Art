"use client";

import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import { normalizeCollectionArtworkIds } from "@/features/collection/domain/collection";

export async function getCurrentCollectionUser() {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return null;
  return user;
}

export async function listCollectedArtworkIds() {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentCollectionUser();
  if (!user) return [] as string[];

  const { data, error } = await supabase
    .from("user_collection")
    .select("artwork_id")
    .eq("user_id", user.id)
    .order("collected_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to load collection: ${error.message}`);
  }

  return normalizeCollectionArtworkIds(data);
}

export async function collectArtwork(artworkId: string) {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentCollectionUser();

  if (!user) {
    return { collected: false, reason: "unauthenticated" as const };
  }

  const { error } = await supabase.from("user_collection").insert({
    user_id: user.id,
    artwork_id: artworkId,
  });

  if (error && error.code !== "23505") {
    throw new Error(`Unable to save collection item: ${error.message}`);
  }

  return { collected: true, reason: null };
}
