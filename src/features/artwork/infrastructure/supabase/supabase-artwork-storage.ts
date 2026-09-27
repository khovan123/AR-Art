import type { ArtworkStorage } from "@/features/artwork/application/ports/artwork-storage";
import type { Artwork } from "@/features/artwork/domain/artwork";
import {
  getArtworkBucketName,
  getSupabaseServerClient,
} from "@/features/artwork/infrastructure/supabase/supabase-clients";

export class SupabaseArtworkStorage implements ArtworkStorage {
  async createSignedUpload(path: string) {
    const supabase = getSupabaseServerClient();
    const bucket = getArtworkBucketName();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) {
      throw new Error(`Unable to create upload URL for ${path}: ${error.message}`);
    }

    return { path, token: data.token };
  }

  async assertAssetsExist(artwork: Artwork) {
    const supabase = getSupabaseServerClient();
    const bucket = getArtworkBucketName();
    const expected = new Set([
      artwork.targetImagePath.split("/").at(-1),
      artwork.targetFilePath.split("/").at(-1),
      artwork.overlayPath.split("/").at(-1),
    ]);

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(artwork.id, { limit: 20 });

    if (error) throw new Error(`Unable to verify uploaded assets: ${error.message}`);

    const uploaded = new Set(data.map((item) => item.name));
    for (const fileName of expected) {
      if (!fileName || !uploaded.has(fileName)) {
        throw new Error("One or more artwork files did not finish uploading.");
      }
    }
  }

  getPublicUrls(artwork: Artwork) {
    const supabase = getSupabaseServerClient();
    const bucket = getArtworkBucketName();
    const publicUrl = (path: string) =>
      supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

    return {
      targetImageUrl: publicUrl(artwork.targetImagePath),
      targetFileUrl: publicUrl(artwork.targetFilePath),
      overlayUrl: publicUrl(artwork.overlayPath),
    };
  }
}
