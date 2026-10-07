import type { ArtworkStorage } from "@/features/artwork/application/ports/artwork-storage";
import type { Artwork } from "@/features/artwork/domain/artwork";
import {
  getArtworkBucketName,
  getSupabaseServerClient,
} from "@/features/artwork/infrastructure/supabase/supabase-clients";

function arAssetPaths(artwork: Artwork) {
  return (artwork.arConfig.layers ?? [])
    .map((layer) => layer.assetPath)
    .filter((path): path is string => Boolean(path));
}

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
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(artwork.id, { limit: 20 });

    if (error) throw new Error(`Unable to verify uploaded assets: ${error.message}`);

    const rootFiles = new Set(data.map((item) => item.name));
    const rootExpected = [artwork.targetImagePath, artwork.targetFilePath, artwork.overlayPath]
      .filter((path): path is string => Boolean(path))
      .map((path) => path.split("/").at(-1));

    for (const fileName of rootExpected) {
      if (!fileName || !rootFiles.has(fileName)) {
        throw new Error("One or more artwork files did not finish uploading.");
      }
    }

    const layerPaths = arAssetPaths(artwork);
    if (layerPaths.length > 0) {
      const { data: layerFiles, error: layerError } = await supabase.storage
        .from(bucket)
        .list(`${artwork.id}/layers`, { limit: 20 });
      if (layerError) {
        throw new Error(`Unable to verify AR layers: ${layerError.message}`);
      }
      const uploadedLayers = new Set(layerFiles.map((item) => item.name));
      for (const path of layerPaths) {
        const fileName = path.split("/").at(-1);
        if (!fileName || !uploadedLayers.has(fileName)) {
          throw new Error("One or more AR layers did not finish uploading.");
        }
      }
    }

  }

  async removeAssets(artwork: Artwork) {
    const supabase = getSupabaseServerClient();
    const bucket = getArtworkBucketName();
    const paths = [
      artwork.targetImagePath,
      artwork.targetFilePath,
      ...(artwork.overlayPath ? [artwork.overlayPath] : []),
      ...arAssetPaths(artwork),
    ];
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) throw new Error(`Unable to remove artwork assets: ${error.message}`);
  }

  getPublicUrls(artwork: Artwork) {
    const supabase = getSupabaseServerClient();
    const bucket = getArtworkBucketName();
    const publicUrl = (path: string) =>
      supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

    return {
      targetImageUrl: publicUrl(artwork.targetImagePath),
      targetFileUrl: publicUrl(artwork.targetFilePath),
      overlayUrl: artwork.overlayPath ? publicUrl(artwork.overlayPath) : null,
      arAssetUrls: Object.fromEntries(
        arAssetPaths(artwork).map((path) => [path, publicUrl(path)]),
      ),
    };
  }
}
