import type {
  Artwork,
  ArtworkAssetUrls,
  SignedUploadSlot,
} from "@/features/artwork/domain/artwork";

export interface ArtworkStorage {
  createSignedUpload(path: string): Promise<SignedUploadSlot>;
  assertAssetsExist(artwork: Artwork): Promise<void>;
  getPublicUrls(artwork: Artwork): ArtworkAssetUrls;
}
