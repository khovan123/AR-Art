import type { ArtworkRepository } from "@/features/artwork/application/ports/artwork-repository";
import type { ArtworkStorage } from "@/features/artwork/application/ports/artwork-storage";
import type { PublishedArtwork, UpdateArtworkInput } from "@/features/artwork/domain/artwork";

export class UpdateStudioArtwork {
  constructor(
    private readonly repository: ArtworkRepository,
    private readonly storage: ArtworkStorage,
  ) {}

  async execute(
    id: string,
    ownerId: string,
    input: UpdateArtworkInput,
  ): Promise<PublishedArtwork | null> {
    const artwork = await this.repository.updateForOwner(id, ownerId, input);
    if (!artwork) return null;

    return {
      ...artwork,
      ...this.storage.getPublicUrls(artwork),
    };
  }
}
