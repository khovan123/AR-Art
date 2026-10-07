import assert from "node:assert/strict";
import test from "node:test";

import {
  ARTWORK_UPLOAD_MAX_FILE_SIZE,
  artworkCreateFormSchema,
} from "./artwork-create-form-schema.ts";

function makeFile(name: string, type: string, size = 16) {
  return new File([new Uint8Array(size)], name, { type });
}

function baseValues() {
  return {
    title: "  Neon Rift  ",
    artistName: "  Everie Studio  ",
    targetImage: makeFile("target.png", "image/png"),
    spatialLayers: [],
  };
}

test("accepts motion extract and trims text", () => {
  const result = artworkCreateFormSchema.parse({
    ...baseValues(),
    arMode: "motion_extract",
    overlayVideo: makeFile("overlay.mp4", "video/mp4"),
  });

  assert.equal(result.title, "Neon Rift");
  assert.equal(result.artistName, "Everie Studio");
  assert.equal(result.arMode, "motion_extract");
});

test("accepts transparent motion video", () => {
  const result = artworkCreateFormSchema.safeParse({
    ...baseValues(),
    arMode: "transparent_motion",
    overlayVideo: makeFile("motion.webm", "video/webm"),
  });

  assert.equal(result.success, true);
});

test("accepts layered AR with image and GLB assets", () => {
  const result = artworkCreateFormSchema.safeParse({
    ...baseValues(),
    arMode: "spatial_layers",
    spatialLayers: [
      {
        file: makeFile("glow.png", "image/png"),
        animation: "pulse",
        blendMode: "additive",
        x: 0,
        y: 0,
        depth: 0.05,
        scale: 0.4,
      },
      {
        file: makeFile("orb.glb", "model/gltf-binary"),
        animation: "rotate",
        blendMode: "normal",
        x: 0,
        y: 0,
        depth: 0.12,
        scale: 0.25,
      },
    ],
  });

  assert.equal(result.success, true);
});

test("requires a motion video outside layered AR", () => {
  const result = artworkCreateFormSchema.safeParse({
    ...baseValues(),
    arMode: "motion_extract",
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(
      result.error.issues.some(
        (issue) => issue.message === "AR motion video is required for this mode.",
      ),
    );
  }
});

test("rejects unsupported artwork and motion mime types", () => {
  const result = artworkCreateFormSchema.safeParse({
    ...baseValues(),
    arMode: "transparent_motion",
    targetImage: makeFile("target.gif", "image/gif"),
    overlayVideo: makeFile("overlay.mov", "video/quicktime"),
  });

  assert.equal(result.success, false);
  if (!result.success) {
    const messages = result.error.issues.map((issue) => issue.message);
    assert.ok(messages.includes("Target image must be JPG, PNG, or WebP."));
    assert.ok(messages.includes("AR motion must be MP4 or WebM."));
  }
});

test("rejects files larger than the MVP upload limit", () => {
  const result = artworkCreateFormSchema.safeParse({
    ...baseValues(),
    arMode: "motion_extract",
    targetImage: makeFile(
      "target.png",
      "image/png",
      ARTWORK_UPLOAD_MAX_FILE_SIZE + 1,
    ),
    overlayVideo: makeFile("overlay.mp4", "video/mp4"),
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(
      result.error.issues.some(
        (issue) =>
          issue.message ===
          "Each uploaded file must be 6 MB or smaller for this MVP.",
      ),
    );
  }
});
