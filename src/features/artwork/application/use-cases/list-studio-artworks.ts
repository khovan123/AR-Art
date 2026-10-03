import type { ArtworkRepository } from "@/features/artwork/application/ports/artwork-repository";
import type { ArtworkStorage } from "@/features/artwork/application/ports/artwork-storage";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";

export class ListStudioArtworks {
  constructor(
    private readonly repository: ArtworkRepository,
    private readonly storage: ArtworkStorage,
  ) {}

  async execute(ownerId: string): Promise<PublishedArtwork[]> {
    const artworks = await this.repository.listForOwner(ownerId);

    return artworks.map((artwork) => ({
      ...artwork,
      ...this.storage.getPublicUrls(artwork),
    }));
  }
}
