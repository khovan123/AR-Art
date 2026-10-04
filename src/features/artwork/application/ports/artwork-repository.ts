import type {
  Artwork,
  CreateArtworkDraftInput,
  UpdateArtworkInput,
} from "@/features/artwork/domain/artwork";

export interface ArtworkRepository {
  createDraft(input: CreateArtworkDraftInput): Promise<Artwork>;
  findById(id: string): Promise<Artwork | null>;
  findPublishedBySlug(slug: string): Promise<Artwork | null>;
  listPublished(): Promise<Artwork[]>;
  listForOwner(ownerId: string): Promise<Artwork[]>;
  updateForOwner(id: string, ownerId: string, input: UpdateArtworkInput): Promise<Artwork | null>;
  countPublished(): Promise<number>;
  markPublished(id: string): Promise<Artwork>;
}
