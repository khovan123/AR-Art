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
    overlay?: File;
    spatialLayers: File[];
  },
  onStep: (step: number) => void,
) {
  let step = 1;
  onStep(step);
  await upload(
    session.bucket,
    session.uploads.targetImage,
    input.targetImage,
    input.targetImage.type,
  );

  step += 1;
  onStep(step);
  await upload(
    session.bucket,
    session.uploads.targetMind,
    input.targetMind,
    "application/octet-stream",
  );

  if (session.uploads.overlay) {
    if (!input.overlay) throw new Error("AR motion video is missing.");
    step += 1;
    onStep(step);
    await upload(
      session.bucket,
      session.uploads.overlay,
      input.overlay,
      input.overlay.type,
    );
  }

  if (session.uploads.spatialLayers.length !== input.spatialLayers.length) {
    throw new Error("AR layer upload plan no longer matches the selected files.");
  }

  for (let index = 0; index < session.uploads.spatialLayers.length; index += 1) {
    const planned = session.uploads.spatialLayers[index];
    const file = input.spatialLayers[index];
    if (!planned || !file) throw new Error("An AR layer is missing.");

    step += 1;
    onStep(step);
    await upload(
      session.bucket,
      planned.slot,
      file,
      file.type || "application/octet-stream",
    );
  }

  onStep(step + 1);
}
