import assert from "node:assert/strict";
import test from "node:test";

import {
  ARTWORK_UPLOAD_MAX_FILE_SIZE,
  artworkCreateFormSchema,
} from "./artwork-create-form-schema.ts";

function makeFile(name: string, type: string, size = 16) {
  return new File([new Uint8Array(size)], name, { type });
}

test("accepts valid artwork create form values and trims text", () => {
  const result = artworkCreateFormSchema.parse({
    title: "  Neon Rift  ",
    artistName: "  Everie Studio  ",
    targetImage: makeFile("target.png", "image/png"),
    overlayVideo: makeFile("overlay.mp4", "video/mp4"),
  });

  assert.equal(result.title, "Neon Rift");
  assert.equal(result.artistName, "Everie Studio");
});

test("rejects unsupported artwork and video mime types", () => {
  const result = artworkCreateFormSchema.safeParse({
    title: "Neon Rift",
    artistName: "Everie Studio",
    targetImage: makeFile("target.gif", "image/gif"),
    overlayVideo: makeFile("overlay.mov", "video/quicktime"),
  });

  assert.equal(result.success, false);
  if (!result.success) {
    const messages = result.error.issues.map((issue) => issue.message);
    assert.ok(messages.includes("Target image must be JPG, PNG, or WebP."));
    assert.ok(messages.includes("AR overlay must be MP4 or WebM."));
  }
});

test("rejects files larger than the MVP upload limit", () => {
  const result = artworkCreateFormSchema.safeParse({
    title: "Neon Rift",
    artistName: "Everie Studio",
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
