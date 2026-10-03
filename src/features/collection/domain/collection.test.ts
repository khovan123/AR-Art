import assert from "node:assert/strict";
import test from "node:test";

import { normalizeCollectionArtworkIds } from "./collection.ts";

test("normalizes cloud collection artwork ids", () => {
  assert.deepEqual(
    normalizeCollectionArtworkIds([
      { artwork_id: "art-1" },
      { artwork_id: "art-1" },
      { artwork_id: "art-2" },
      { artwork_id: "" },
      { artwork_id: null },
    ]),
    ["art-1", "art-2"],
  );
});

test("returns an empty collection for no rows", () => {
  assert.deepEqual(normalizeCollectionArtworkIds(null), []);
  assert.deepEqual(normalizeCollectionArtworkIds(undefined), []);
});
