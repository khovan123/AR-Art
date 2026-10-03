export function normalizeCollectionArtworkIds(
  rows: Array<{ artwork_id?: unknown }> | null | undefined,
) {
  return Array.from(
    new Set(
      (rows ?? [])
        .map((row) => row.artwork_id)
        .filter(
          (artworkId): artworkId is string =>
            typeof artworkId === "string" && artworkId.trim().length > 0,
        ),
    ),
  );
}
