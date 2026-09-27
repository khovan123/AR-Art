import type { ArtworkRepository } from "@/features/artwork/application/ports/artwork-repository";
import type { ArtworkStorage } from "@/features/artwork/application/ports/artwork-storage";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";

export class PublishArtwork {
  constructor(
    private readonly repository: ArtworkRepository,
    private readonly storage: ArtworkStorage,
  ) {}

  async execute(id: string): Promise<PublishedArtwork> {
    const artwork = await this.repository.findById(id);
    if (!artwork) throw new Error("Artwork draft was not found.");

    await this.storage.assertAssetsExist(artwork);
    const published = await this.repository.markPublished(id);

    return {
      ...published,
      ...this.storage.getPublicUrls(published),
    };
  }
}
