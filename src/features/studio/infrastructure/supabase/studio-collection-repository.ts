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

async function requireUser() {
  const user = await getCurrentCollectionUser();
  if (!user) throw new Error("Authentication required.");
  return user;
}

export async function listCreatorCollections(): Promise<CreatorCollection[]> {
  const user = await getCurrentCollectionUser();
  if (!user) return [];

  const supabase = getSupabaseBrowserClient();
  const { data: collections, error } = await supabase
    .from("creator_collections")
    .select("id,name,status,created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to load collections: ${error.message}`);
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
  status: "draft" | "published";
}) {
  const user = await requireUser();
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("creator_collections")
    .insert({
      owner_id: user.id,
      name: input.name.trim(),
      description: "",
      status: input.status,
    })
    .select("id,name,status,created_at")
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

export async function updateCreatorCollection(input: {
  id: string;
  name: string;
  productIds: string[];
  status: "draft" | "published";
}) {
  const user = await requireUser();
  const supabase = getSupabaseBrowserClient();

  const { data: previousLinks, error: previousLinksError } = await supabase
    .from("creator_collection_artworks")
    .select("artwork_id,position")
    .eq("collection_id", input.id)
    .order("position", { ascending: true });

  if (previousLinksError) {
    throw new Error(`Unable to update collection: ${previousLinksError.message}`);
  }

  const { data, error } = await supabase
    .from("creator_collections")
    .update({
      name: input.name.trim(),
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("owner_id", user.id)
    .select("id,name,status,created_at")
    .single();

  if (error) throw new Error(`Unable to update collection: ${error.message}`);

  const { error: removeError } = await supabase
    .from("creator_collection_artworks")
    .delete()
    .eq("collection_id", input.id);

  if (removeError) throw new Error(`Unable to update collection products: ${removeError.message}`);

  if (input.productIds.length > 0) {
    const { error: insertError } = await supabase
      .from("creator_collection_artworks")
      .insert(
        input.productIds.map((artworkId, position) => ({
          collection_id: input.id,
          artwork_id: artworkId,
          position,
        })),
      );

    if (insertError) {
      if (previousLinks?.length) {
        await supabase.from("creator_collection_artworks").insert(
          previousLinks.map((link) => ({
            collection_id: input.id,
            artwork_id: link.artwork_id,
            position: link.position,
          })),
        );
      }
      throw new Error(`Unable to update collection products: ${insertError.message}`);
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

export async function deleteCreatorCollection(id: string) {
  const user = await requireUser();
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("creator_collections")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) throw new Error(`Unable to delete collection: ${error.message}`);
}
