import { z } from "zod";

export const ARTWORK_UPLOAD_MAX_FILE_SIZE = 6 * 1024 * 1024;

const MAX_SPATIAL_LAYERS = 12;
const MAX_SPATIAL_VIDEOS = 2;
const MAX_SPATIAL_MODELS = 1;
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const videoTypes = new Set(["video/mp4", "video/webm"]);
const spatialTypes = new Set([
  ...imageTypes,
  ...videoTypes,
  "model/gltf-binary",
  "application/octet-stream",
]);

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function fileSchema(options: {
  missingMessage: string;
  typeMessage: string;
  allowedTypes: Set<string>;
}) {
  return z
    .custom<File>(isFile, options.missingMessage)
    .refine((file) => options.allowedTypes.has(file.type), options.typeMessage)
    .refine(
      (file) => file.size <= ARTWORK_UPLOAD_MAX_FILE_SIZE,
      "Each uploaded file must be 6 MB or smaller for this MVP.",
    );
}

const optionalVideoSchema = z
  .custom<File>(isFile)
  .optional()
  .refine(
    (file) => !file || videoTypes.has(file.type),
    "AR motion must be MP4 or WebM.",
  )
  .refine(
    (file) => !file || file.size <= ARTWORK_UPLOAD_MAX_FILE_SIZE,
    "Each uploaded file must be 6 MB or smaller for this MVP.",
  );

const spatialFileSchema = z
  .custom<File>(isFile, "Choose a layer file.")
  .refine(
    (file) => spatialTypes.has(file.type) || file.name.toLowerCase().endsWith(".glb"),
    "Layers must be PNG, JPG, WebP, MP4, WebM, or GLB.",
  )
  .refine(
    (file) => file.size <= ARTWORK_UPLOAD_MAX_FILE_SIZE,
    "Each uploaded file must be 6 MB or smaller for this MVP.",
  );

export const spatialLayerFormSchema = z.object({
  file: spatialFileSchema,
  animation: z.enum(["none", "float", "pulse", "rotate", "orbit"]),
  blendMode: z.enum(["normal", "additive"]),
  x: z.number().min(-1.5).max(1.5),
  y: z.number().min(-1.5).max(1.5),
  depth: z.number().min(0).max(1),
  scale: z.number().min(0.05).max(3),
});

export const artworkCreateFormSchema = z
  .object({
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
    arMode: z.enum(["motion_extract", "transparent_motion", "spatial_layers"]),
    targetImage: fileSchema({
      missingMessage: "Tracking artwork is required.",
      typeMessage: "Target image must be JPG, PNG, or WebP.",
      allowedTypes: imageTypes,
    }),
    overlayVideo: optionalVideoSchema,
    spatialLayers: z.array(spatialLayerFormSchema).max(MAX_SPATIAL_LAYERS),
  })
  .superRefine((value, context) => {
    if (value.arMode !== "spatial_layers" && !value.overlayVideo) {
      context.addIssue({
        code: "custom",
        path: ["overlayVideo"],
        message: "AR motion video is required for this mode.",
      });
    }

    if (value.arMode === "spatial_layers") {
      if (value.spatialLayers.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["spatialLayers"],
          message: "Add at least one AR layer.",
        });
      }

      const videoCount = value.spatialLayers.filter((layer) =>
        videoTypes.has(layer.file.type),
      ).length;
      const modelCount = value.spatialLayers.filter(
        (layer) =>
          layer.file.type === "model/gltf-binary" ||
          layer.file.name.toLowerCase().endsWith(".glb"),
      ).length;

      if (videoCount > MAX_SPATIAL_VIDEOS) {
        context.addIssue({
          code: "custom",
          path: ["spatialLayers"],
          message: `Layered AR supports up to ${MAX_SPATIAL_VIDEOS} video layers.`,
        });
      }
      if (modelCount > MAX_SPATIAL_MODELS) {
        context.addIssue({
          code: "custom",
          path: ["spatialLayers"],
          message: `Layered AR supports up to ${MAX_SPATIAL_MODELS} 3D model.`,
        });
      }
    }
  });

export type ArtworkCreateFormValues = z.infer<typeof artworkCreateFormSchema>;
