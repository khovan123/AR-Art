import type {
  ArtworkUploadSession,
  SignedUploadSlot,
} from "@/features/artwork/domain/artwork";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";

async function upload(
  bucket: string,
  slot: SignedUploadSlot,
  body: File | Blob,
  contentType: string,
) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(slot.path, slot.token, body, {
      cacheControl: "31536000",
      contentType,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);
}

export async function uploadArtworkAssets(
  session: ArtworkUploadSession,
  input: {
    targetImage: File;
    targetMind: Blob;
    overlay: File;
  },
  onStep: (step: number) => void,
) {
  onStep(1);
  await upload(
    session.bucket,
    session.uploads.targetImage,
    input.targetImage,
    input.targetImage.type,
  );

  onStep(2);
  await upload(
    session.bucket,
    session.uploads.targetMind,
    input.targetMind,
    "application/octet-stream",
  );

  onStep(3);
  await upload(
    session.bucket,
    session.uploads.overlay,
    input.overlay,
    input.overlay.type,
  );

  onStep(4);
}
