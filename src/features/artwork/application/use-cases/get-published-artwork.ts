import type { ArtworkRepository } from "@/features/artwork/application/ports/artwork-repository";
import type { ArtworkStorage } from "@/features/artwork/application/ports/artwork-storage";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";

export class GetPublishedArtwork {
  constructor(
    private readonly repository: ArtworkRepository,
    private readonly storage: ArtworkStorage,
  ) {}

  async execute(slug: string): Promise<PublishedArtwork | null> {
    const artwork = await this.repository.findPublishedBySlug(slug);
    if (!artwork) return null;

    return {
      ...artwork,
      ...this.storage.getPublicUrls(artwork),
    };
  }
}
