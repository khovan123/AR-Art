export const EVERIE_MVP_MAX_PRODUCTS = 10;

export type ArtworkStatus = "draft" | "published";

export interface Artwork {
  id: string;
  ownerId: string | null;
  slug: string;
  title: string;
  artistName: string;
  description: string;
  status: ArtworkStatus;
  targetImagePath: string;
  targetFilePath: string;
  overlayPath: string;
  overlayType: "video";
  overlayAspectRatio: number;
  createdAt: string;
  publishedAt: string | null;
}

export interface ArtworkAssetUrls {
  targetImageUrl: string;
  targetFileUrl: string;
  overlayUrl: string;
}

export interface PublishedArtwork extends Artwork, ArtworkAssetUrls {}

export interface CreateArtworkDraftInput {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  artistName: string;
  description: string;
  targetImagePath: string;
  targetFilePath: string;
  overlayPath: string;
  overlayAspectRatio: number;
}

export interface UpdateArtworkInput {
  title: string;
  artistName: string;
  description: string;
  status: ArtworkStatus;
}

export interface SignedUploadSlot {
  path: string;
  token: string;
}

export interface ArtworkUploadSession {
  artworkId: string;
  slug: string;
  bucket: string;
  uploads: {
    targetImage: SignedUploadSlot;
    targetMind: SignedUploadSlot;
    overlay: SignedUploadSlot;
  };
}
