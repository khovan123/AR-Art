"use client";

import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import { getCurrentCollectionUser } from "@/features/collection/infrastructure/supabase/collection-repository";

export type CreatorCollection = {
  id: string;
  name: string;
  status: "draft" | "published";
  createdAt: string;
  artworkIds: string[];
};

export async function listCreatorCollections(): Promise<CreatorCollection[]> {
  const user = await getCurrentCollectionUser();
  if (!user) return [];

  const supabase = getSupabaseBrowserClient();
  const { data: collections, error } = await supabase
    .from("creator_collections")
    .select("id,name,description,status,created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to load creator collections: ${error.message}`);
  if (!collections?.length) return [];

  const ids = collections.map((collection) => collection.id);
  const { data: links, error: linksError } = await supabase
    .from("creator_collection_artworks")
    .select("collection_id,artwork_id,position")
    .in("collection_id", ids)
    .order("position", { ascending: true });

  if (linksError) throw new Error(`Unable to load collection products: ${linksError.message}`);

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    status: collection.status as "draft" | "published",
    createdAt: collection.created_at,
    artworkIds: (links ?? [])
      .filter((link) => link.collection_id === collection.id)
      .map((link) => link.artwork_id),
  }));
}

export async function createCreatorCollection(input: {
  name: string;
  productIds: string[];
}) {
  const user = await getCurrentCollectionUser();
  if (!user) throw new Error("Authentication required.");

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("creator_collections")
    .insert({
      owner_id: user.id,
      name: input.name.trim(),
      description: "",
      status: "draft",
    })
    .select("id,name,description,status,created_at")
    .single();

  if (error) throw new Error(`Unable to create collection: ${error.message}`);

  if (input.productIds.length > 0) {
    const { error: linksError } = await supabase
      .from("creator_collection_artworks")
      .insert(
        input.productIds.map((artworkId, position) => ({
          collection_id: data.id,
          artwork_id: artworkId,
          position,
        })),
      );

    if (linksError) {
      await supabase.from("creator_collections").delete().eq("id", data.id);
      throw new Error(`Unable to add products to collection: ${linksError.message}`);
    }
  }

  return {
    id: data.id,
    name: data.name,
    status: data.status as "draft" | "published",
    createdAt: data.created_at,
    artworkIds: input.productIds,
  } satisfies CreatorCollection;
}
