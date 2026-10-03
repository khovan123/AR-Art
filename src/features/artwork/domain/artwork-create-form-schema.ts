import { z } from "zod";

export const ARTWORK_UPLOAD_MAX_FILE_SIZE = 6 * 1024 * 1024;

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const videoTypes = new Set(["video/mp4", "video/webm"]);

function fileSchema(options: {
  missingMessage: string;
  typeMessage: string;
  allowedTypes: Set<string>;
}) {
  return z
    .custom<File>(
      (value) => typeof File !== "undefined" && value instanceof File,
      options.missingMessage,
    )
    .refine((file) => options.allowedTypes.has(file.type), options.typeMessage)
    .refine(
      (file) => file.size <= ARTWORK_UPLOAD_MAX_FILE_SIZE,
      "Each uploaded file must be 6 MB or smaller for this MVP.",
    );
}

export const artworkCreateFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Artwork title is required.")
    .max(120, "Artwork title must be 120 characters or fewer."),
  artistName: z
    .string()
    .trim()
    .min(1, "Artist / creator is required.")
    .max(120, "Artist / creator must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(1200, "Description must be 1200 characters or fewer."),
  targetImage: fileSchema({
    missingMessage: "Tracking artwork is required.",
    typeMessage: "Target image must be JPG, PNG, or WebP.",
    allowedTypes: imageTypes,
  }),
  overlayVideo: fileSchema({
    missingMessage: "AR animation is required.",
    typeMessage: "AR overlay must be MP4 or WebM.",
    allowedTypes: videoTypes,
  }),
});

export type ArtworkCreateFormValues = z.infer<typeof artworkCreateFormSchema>;
