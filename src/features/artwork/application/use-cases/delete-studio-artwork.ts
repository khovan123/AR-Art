import type { ArtworkRepository } from "@/features/artwork/application/ports/artwork-repository";
import type { ArtworkStorage } from "@/features/artwork/application/ports/artwork-storage";

export class DeleteStudioArtwork {
  constructor(
    private readonly repository: ArtworkRepository,
    private readonly storage: ArtworkStorage,
  ) {}

  async execute(id: string, ownerId: string) {
    const artwork = await this.repository.deleteForOwner(id, ownerId);
    if (!artwork) return false;

    try {
      await this.storage.removeAssets(artwork);
    } catch {
      // Database deletion is authoritative. Any orphaned storage objects can be
      // cleaned later without restoring a product that is already gone.
    }

    return true;
  }
}
