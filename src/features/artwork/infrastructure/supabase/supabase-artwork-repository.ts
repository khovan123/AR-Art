import type { ArtworkRepository } from "@/features/artwork/application/ports/artwork-repository";
import {
  EVERIE_MVP_MAX_PRODUCTS,
  type Artwork,
  type CreateArtworkDraftInput,
  type UpdateArtworkInput,
} from "@/features/artwork/domain/artwork";
import { getSupabaseServerClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";

type ArtworkRow = {
  id: string;
  owner_id: string | null;
  slug: string;
  title: string;
  artist_name: string;
  description: string;
  status: "draft" | "published";
  target_image_path: string;
  target_file_path: string;
  overlay_path: string;
  overlay_type: "video";
  overlay_aspect_ratio: number;
  created_at: string;
  published_at: string | null;
};

function mapArtwork(row: ArtworkRow): Artwork {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    title: row.title,
    artistName: row.artist_name,
    description: row.description,
    status: row.status,
    targetImagePath: row.target_image_path,
    targetFilePath: row.target_file_path,
    overlayPath: row.overlay_path,
    overlayType: row.overlay_type,
    overlayAspectRatio: row.overlay_aspect_ratio,
    createdAt: row.created_at,
    publishedAt: row.published_at,
  };
}

export class SupabaseArtworkRepository implements ArtworkRepository {
  async createDraft(input: CreateArtworkDraftInput) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("artworks")
      .insert({
        id: input.id,
        owner_id: input.ownerId,
        slug: input.slug,
        title: input.title,
        artist_name: input.artistName,
        description: input.description,
        status: "draft",
        target_image_path: input.targetImagePath,
        target_file_path: input.targetFilePath,
        overlay_path: input.overlayPath,
        overlay_type: "video",
        overlay_aspect_ratio: input.overlayAspectRatio,
      })
      .select("*")
      .single<ArtworkRow>();

    if (error) throw new Error(`Unable to create artwork draft: ${error.message}`);
    return mapArtwork(data);
  }

  async findById(id: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .eq("id", id)
      .maybeSingle<ArtworkRow>();

    if (error) throw new Error(`Unable to load artwork: ${error.message}`);
    return data ? mapArtwork(data) : null;
  }

  async findPublishedBySlug(slug: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle<ArtworkRow>();

    if (error) throw new Error(`Unable to load artwork: ${error.message}`);
    return data ? mapArtwork(data) : null;
  }

  async listPublished() {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: true })
      .limit(EVERIE_MVP_MAX_PRODUCTS)
      .returns<ArtworkRow[]>();

    if (error) throw new Error(`Unable to load published artworks: ${error.message}`);
    return (data ?? []).map(mapArtwork);
  }

  async listForOwner(ownerId: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .or(`owner_id.eq.${ownerId},owner_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(EVERIE_MVP_MAX_PRODUCTS)
      .returns<ArtworkRow[]>();

    if (error) throw new Error(`Unable to load studio artworks: ${error.message}`);
    return (data ?? []).map(mapArtwork);
  }

  async updateForOwner(id: string, ownerId: string, input: UpdateArtworkInput) {
    const supabase = getSupabaseServerClient();
    const { data: current, error: currentError } = await supabase
      .from("artworks")
      .select("published_at")
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle<{ published_at: string | null }>();

    if (currentError) throw new Error(`Unable to update artwork: ${currentError.message}`);
    if (!current) return null;

    const { data, error } = await supabase
      .from("artworks")
      .update({
        title: input.title.trim(),
        artist_name: input.artistName.trim(),
        description: input.description.trim(),
        status: input.status,
        published_at:
          input.status === "published"
            ? current.published_at ?? new Date().toISOString()
            : null,
      })
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select("*")
      .maybeSingle<ArtworkRow>();

    if (error) throw new Error(`Unable to update artwork: ${error.message}`);
    return data ? mapArtwork(data) : null;
  }

  async deleteForOwner(id: string, ownerId: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("artworks")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select("*")
      .maybeSingle<ArtworkRow>();

    if (error) throw new Error(`Unable to delete artwork: ${error.message}`);
    return data ? mapArtwork(data) : null;
  }

  async countPublished() {
    const supabase = getSupabaseServerClient();
    const { count, error } = await supabase
      .from("artworks")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");

    if (error) throw new Error(`Unable to count published artworks: ${error.message}`);
    return count ?? 0;
  }

  async markPublished(id: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("artworks")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single<ArtworkRow>();

    if (error) throw new Error(`Unable to publish artwork: ${error.message}`);
    return mapArtwork(data);
  }
}
