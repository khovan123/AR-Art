import assert from "node:assert/strict";
import test from "node:test";

import { normalizeCollectedSlugs } from "./collection-storage.ts";

test("normalizes collected slugs by removing invalid and duplicate values", () => {
  assert.deepEqual(
    normalizeCollectedSlugs([
      "neon-rift",
      "neon-rift",
      "everie-rose",
      "",
      "   ",
      null,
      42,
    ]),
    ["neon-rift", "everie-rose"],
  );
});

test("returns an empty collection for non-array persisted values", () => {
  assert.deepEqual(normalizeCollectedSlugs(null), []);
  assert.deepEqual(normalizeCollectedSlugs({ slug: "neon-rift" }), []);
});

test("keeps the browser collection within the ten-product Everie MVP limit", () => {
  const slugs = Array.from({ length: 12 }, (_, index) => `everie-${index + 1}`);
  assert.deepEqual(normalizeCollectedSlugs(slugs), slugs.slice(0, 10));
});
