import type { ArtworkRepository } from "@/features/artwork/application/ports/artwork-repository";
import type { ArtworkStorage } from "@/features/artwork/application/ports/artwork-storage";
import type { ArtworkUploadSession } from "@/features/artwork/domain/artwork";

export interface CreateUploadSessionInput {
  title: string;
  artistName: string;
  description: string;
  targetImageExtension: "jpg" | "jpeg" | "png" | "webp";
  overlayExtension: "mp4" | "webm";
  overlayAspectRatio: number;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export class CreateArtworkUploadSession {
  constructor(
    private readonly repository: ArtworkRepository,
    private readonly storage: ArtworkStorage,
    private readonly bucket: string,
  ) {}

  async execute(input: CreateUploadSessionInput): Promise<ArtworkUploadSession> {
    const id = crypto.randomUUID();
    const suffix = id.slice(0, 8);
    const baseSlug = slugify(input.title) || "artwork";
    const slug = `${baseSlug}-${suffix}`;

    const targetImagePath = `${id}/target.${input.targetImageExtension}`;
    const targetFilePath = `${id}/target.mind`;
    const overlayPath = `${id}/overlay.${input.overlayExtension}`;

    await this.repository.createDraft({
      id,
      slug,
      title: input.title,
      artistName: input.artistName,
      description: input.description,
      targetImagePath,
      targetFilePath,
      overlayPath,
      overlayAspectRatio: input.overlayAspectRatio,
    });

    const [targetImage, targetMind, overlay] = await Promise.all([
      this.storage.createSignedUpload(targetImagePath),
      this.storage.createSignedUpload(targetFilePath),
      this.storage.createSignedUpload(overlayPath),
    ]);

    return {
      artworkId: id,
      slug,
      bucket: this.bucket,
      uploads: { targetImage, targetMind, overlay },
    };
  }
}
