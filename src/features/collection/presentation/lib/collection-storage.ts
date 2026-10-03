"use client";

const STORAGE_KEY = "everie.collection.v1";
const COLLECTION_EVENT = "everie:collection-updated";

function normalizeSlugs(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];

  return Array.from(
    new Set(
      value.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      ),
    ),
  );
}

export function getCollectedSlugs() {
  if (typeof window === "undefined") return [] as string[];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeSlugs(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function markArtworkCollected(slug: string) {
  if (typeof window === "undefined" || !slug.trim()) return;

  const current = getCollectedSlugs();
  if (current.includes(slug)) return;

  const next = [...current, slug];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(COLLECTION_EVENT, { detail: next }));
}

export function subscribeToCollection(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  const onCustom = () => listener();

  window.addEventListener("storage", onStorage);
  window.addEventListener(COLLECTION_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(COLLECTION_EVENT, onCustom);
  };
}
