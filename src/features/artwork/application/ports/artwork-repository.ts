import type {
  Artwork,
  CreateArtworkDraftInput,
} from "@/features/artwork/domain/artwork";

export interface ArtworkRepository {
  createDraft(input: CreateArtworkDraftInput): Promise<Artwork>;
  findById(id: string): Promise<Artwork | null>;
  findPublishedBySlug(slug: string): Promise<Artwork | null>;
  markPublished(id: string): Promise<Artwork>;
}
