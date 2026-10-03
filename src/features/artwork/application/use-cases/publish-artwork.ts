import type { ArtworkRepository } from "@/features/artwork/application/ports/artwork-repository";
import type { ArtworkStorage } from "@/features/artwork/application/ports/artwork-storage";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";

const MAX_PUBLISHED_ARTWORKS = 10;

export class PublishArtwork {
  constructor(
    private readonly repository: ArtworkRepository,
    private readonly storage: ArtworkStorage,
  ) {}

  async execute(id: string): Promise<PublishedArtwork> {
    const artwork = await this.repository.findById(id);
    if (!artwork) throw new Error("Artwork draft was not found.");

    if (artwork.status !== "published") {
      const publishedCount = await this.repository.countPublished();
      if (publishedCount >= MAX_PUBLISHED_ARTWORKS) {
        throw new Error(
          `The current Everie MVP supports up to ${MAX_PUBLISHED_ARTWORKS} published products.`,
        );
      }
    }

    await this.storage.assertAssetsExist(artwork);
    const published =
      artwork.status === "published"
        ? artwork
        : await this.repository.markPublished(id);

    return {
      ...published,
      ...this.storage.getPublicUrls(published),
    };
  }
}
