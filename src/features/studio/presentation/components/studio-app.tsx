"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  Check,
  CircleDot,
  FolderPlus,
  ImageIcon,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Orbit,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Modal } from "@/components/molecules/modal";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import { CreatorSpatialScene } from "@/features/artwork/presentation/components/creator-spatial-scene";
import { getCurrentCollectionUser } from "@/features/collection/infrastructure/supabase/collection-repository";
import {
  studioCollectionSchema,
  type StudioCollectionFormValues,
} from "@/features/studio/domain/studio-collection-schema";
import {
  createCreatorCollection,
  deleteCreatorCollection,
  listCreatorCollections,
  updateCreatorCollection,
  type CreatorCollection,
} from "@/features/studio/infrastructure/supabase/studio-collection-repository";

type StudioView = "overview" | "products" | "collections";
type CollectionEditor =
  | { mode: "create" }
  | { mode: "edit"; collectionId: string }
  | null;

type StudioState = {
  phase: "checking" | "loading" | "ready" | "error";
  products: PublishedArtwork[];
  collections: CreatorCollection[];
  error: string | null;
  editor: CollectionEditor;
};

type StudioAction =
  | { type: "loading" }
  | { type: "ready"; products: PublishedArtwork[]; collections: CreatorCollection[] }
  | { type: "collection-saved"; collection: CreatorCollection }
  | { type: "collection-deleted"; collectionId: string }
  | { type: "open-create" }
  | { type: "open-edit"; collectionId: string }
  | { type: "close-editor" }
  | { type: "error"; message: string };

const initialState: StudioState = {
  phase: "checking",
  products: [],
  collections: [],
  error: null,
  editor: null,
};

function reducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "loading":
      return { ...state, phase: "loading", error: null };
    case "ready":
      return {
        phase: "ready",
        products: action.products,
        collections: action.collections,
        error: null,
        editor: state.editor,
      };
    case "collection-saved": {
      const exists = state.collections.some((collection) => collection.id === action.collection.id);
      return {
        ...state,
        collections: exists
          ? state.collections.map((collection) =>
              collection.id === action.collection.id ? action.collection : collection,
            )
          : [action.collection, ...state.collections],
        editor: null,
      };
    }
    case "collection-deleted":
      return {
        ...state,
        collections: state.collections.filter(
          (collection) => collection.id !== action.collectionId,
        ),
        editor: null,
      };
    case "open-create":
      return { ...state, editor: { mode: "create" } };
    case "open-edit":
      return { ...state, editor: { mode: "edit", collectionId: action.collectionId } };
    case "close-editor":
      return { ...state, editor: null };
    case "error":
      return { ...state, phase: "error", error: action.message };
  }
}

function navClass(active: boolean) {
  return `rounded-full px-4 py-2 text-xs font-medium tracking-[0.12em] transition ${
    active
      ? "bg-white text-black shadow-[0_8px_30px_rgba(255,255,255,0.13)]"
      : "border border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
  }`;
}

function statusLabel(status: CreatorCollection["status"]) {
  return status === "published" ? "Live" : "Private";
}

function ProductCard({ product }: { product: PublishedArtwork }) {
  return (
    <article className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/35 p-3 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.3rem] border border-white/8 bg-black/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.targetImageUrl}
          alt={product.title}
          className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.035] group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-white/12 bg-black/45 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-white/65 backdrop-blur">
          {product.status === "published" ? "Live" : "Draft"}
        </span>
      </div>
      <div className="px-2 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-medium text-white">{product.title}</h3>
            <p className="mt-1 text-xs text-white/38">by {product.artistName}</p>
          </div>
          {product.status === "published" && (
            <Link
              href={`/art/${product.slug}`}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition hover:bg-white/10 hover:text-white"
              aria-label={`Open ${product.title}`}
            >
              <ArrowUpRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function CollectionCard({
  collection,
  products,
  onOpen,
}: {
  collection: CreatorCollection;
  products: PublishedArtwork[];
  onOpen: () => void;
}) {
  const collectionProducts = collection.artworkIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is PublishedArtwork => Boolean(product));
  const cover = collectionProducts[0];
  const secondary = collectionProducts.slice(1, 3);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/34 text-left backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-white/22 hover:bg-white/[0.055]"
    >
      <div className="relative aspect-[16/8.7] overflow-hidden border-b border-white/8 bg-[radial-gradient(circle_at_70%_30%,rgba(124,58,237,0.2),transparent_34%),radial-gradient(circle_at_25%_75%,rgba(34,211,238,0.12),transparent_36%),#08080d]">
        {cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.targetImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-700 group-hover:scale-[1.035] group-hover:opacity-68"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090f] via-black/15 to-black/20" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-20 items-center justify-center rounded-[1.8rem] border border-white/10 bg-white/[0.035] text-white/25 shadow-[0_20px_80px_rgba(124,58,237,0.2)]">
              <Layers3 className="size-8" />
            </div>
          </div>
        )}

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.16em] backdrop-blur-xl ${
              collection.status === "published"
                ? "border-emerald-300/18 bg-emerald-300/10 text-emerald-100/75"
                : "border-white/10 bg-black/38 text-white/52"
            }`}
          >
            {statusLabel(collection.status)}
          </span>
        </div>

        {secondary.length > 0 ? (
          <div className="absolute bottom-4 right-4 flex -space-x-3">
            {secondary.map((product, index) => (
              <div
                key={product.id}
                className="size-11 overflow-hidden rounded-xl border border-white/18 bg-black shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                style={{ transform: `rotate(${index === 0 ? -5 : 5}deg)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.targetImageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-4 p-5">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-medium tracking-tight text-white">
            {collection.name}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-xs text-white/35">
            <Boxes className="size-3.5" />
            {collection.artworkIds.length} product{collection.artworkIds.length === 1 ? "" : "s"}
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-white/45 transition group-hover:bg-white/10 group-hover:text-white">
          <Pencil className="size-4" />
        </span>
      </div>
    </button>
  );
}

type EditorUiState = {
  confirmDelete: boolean;
  deleting: boolean;
};

type EditorUiAction =
  | { type: "ask-delete" }
  | { type: "cancel-delete" }
  | { type: "deleting" }
  | { type: "reset" };

function editorUiReducer(state: EditorUiState, action: EditorUiAction): EditorUiState {
  switch (action.type) {
    case "ask-delete":
      return { ...state, confirmDelete: true };
    case "cancel-delete":
      return { ...state, confirmDelete: false };
    case "deleting":
      return { confirmDelete: true, deleting: true };
    case "reset":
      return { confirmDelete: false, deleting: false };
  }
}

function CollectionEditorModal({
  open,
  collection,
  products,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  collection: CreatorCollection | null;
  products: PublishedArtwork[];
  onClose: () => void;
  onSaved: (collection: CreatorCollection) => void;
  onDeleted: (collectionId: string) => void;
}) {
  const [ui, dispatchUi] = useReducer(editorUiReducer, {
    confirmDelete: false,
    deleting: false,
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<StudioCollectionFormValues>({
    resolver: zodResolver(studioCollectionSchema),
    mode: "onChange",
    defaultValues: {
      name: collection?.name ?? "",
      productIds: collection?.artworkIds ?? [],
      status: collection?.status ?? "draft",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: collection?.name ?? "",
      productIds: collection?.artworkIds ?? [],
      status: collection?.status ?? "draft",
    });
    dispatchUi({ type: "reset" });
  }, [collection, open, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      const saved = collection
        ? await updateCreatorCollection({ id: collection.id, ...values })
        : await createCreatorCollection(values);
      onSaved(saved);
    } catch (cause) {
      setError("root", {
        message: cause instanceof Error ? cause.message : "Unable to save collection.",
      });
    }
  });

  async function removeCollection() {
    if (!collection) return;
    if (!ui.confirmDelete) {
      dispatchUi({ type: "ask-delete" });
      return;
    }

    dispatchUi({ type: "deleting" });
    try {
      await deleteCreatorCollection(collection.id);
      onDeleted(collection.id);
    } catch (cause) {
      dispatchUi({ type: "reset" });
      setError("root", {
        message: cause instanceof Error ? cause.message : "Unable to delete collection.",
      });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={collection ? "Manage collection" : "New collection"}
      title={collection ? collection.name : "Create collection"}
      icon={collection ? <Layers3 className="size-4" /> : <FolderPlus className="size-4" />}
      maxWidthClassName="max-w-3xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {collection ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={ui.deleting || isSubmitting}
                  onClick={() => void removeCollection()}
                  className={
                    ui.confirmDelete
                      ? "border-rose-300/25 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15 hover:text-rose-100"
                      : "border-white/10 bg-transparent text-white/42 hover:bg-white/[0.05] hover:text-rose-200"
                  }
                >
                  {ui.deleting ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  {ui.confirmDelete ? "Confirm delete" : "Delete"}
                </Button>
                {ui.confirmDelete && !ui.deleting ? (
                  <button
                    type="button"
                    onClick={() => dispatchUi({ type: "cancel-delete" })}
                    className="text-xs text-white/40 transition hover:text-white"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/10 bg-transparent text-white/55 hover:bg-white/[0.06] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="collection-editor-form"
              disabled={!isValid || isSubmitting || ui.deleting}
              className="bg-white text-black hover:bg-white/90"
            >
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {collection ? "Save changes" : "Create collection"}
            </Button>
          </div>
        </div>
      }
    >
      <form id="collection-editor-form" onSubmit={submit} className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="collection-name" className="text-white/68">Collection name</Label>
          <Input
            id="collection-name"
            placeholder="e.g. Neon Series"
            className="h-11 border-white/10 bg-white/[0.045] text-white"
            {...register("name")}
          />
          {errors.name ? <p className="text-xs text-rose-300">{errors.name.message}</p> : null}
        </div>

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <div>
              <Label className="text-white/68">Visibility</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/[0.025] p-1.5">
                <button
                  type="button"
                  onClick={() => field.onChange("draft")}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${
                    field.value === "draft"
                      ? "bg-white text-black"
                      : "text-white/45 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <LockKeyhole className="size-4" />
                  Private
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange("published")}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${
                    field.value === "published"
                      ? "bg-white text-black"
                      : "text-white/45 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <CircleDot className="size-4" />
                  Live
                </button>
              </div>
            </div>
          )}
        />

        <Controller
          control={control}
          name="productIds"
          render={({ field }) => (
            <div>
              <div className="flex items-center justify-between gap-3">
                <Label className="text-white/68">Products</Label>
                <span className="text-xs text-white/28">{field.value.length}/10 selected</span>
              </div>

              {products.length === 0 ? (
                <div className="mt-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-7 text-center">
                  <ImageIcon className="mx-auto size-5 text-white/25" />
                  <p className="mt-2 text-sm text-white/38">Add a product first.</p>
                </div>
              ) : (
                <div className="mt-2 grid max-h-[42vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {products.map((product) => {
                    const selected = field.value.includes(product.id);
                    const maxReached = field.value.length >= 10 && !selected;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={maxReached}
                        onClick={() =>
                          field.onChange(
                            selected
                              ? field.value.filter((id) => id !== product.id)
                              : [...field.value, product.id],
                          )
                        }
                        className={`group flex min-w-0 items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                          selected
                            ? "border-cyan-200/25 bg-cyan-200/9"
                            : "border-white/8 bg-white/[0.025] hover:border-white/14 hover:bg-white/[0.05]"
                        } disabled:cursor-not-allowed disabled:opacity-35`}
                      >
                        <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-black/55">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.targetImageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white/78">{product.title}</p>
                          <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-white/28">
                            {product.status === "published" ? "Live" : "Draft"}
                          </p>
                        </div>
                        <span
                          className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition ${
                            selected
                              ? "border-cyan-100/40 bg-cyan-100 text-black"
                              : "border-white/14 text-transparent"
                          }`}
                        >
                          <Check className="size-3.5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.productIds ? (
                <p className="mt-2 text-xs text-rose-300">{errors.productIds.message}</p>
              ) : null}
            </div>
          )}
        />

        {errors.root?.message ? (
          <p className="rounded-xl border border-rose-300/15 bg-rose-400/8 px-3 py-2.5 text-sm text-rose-200">
            {errors.root.message}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

export function StudioApp({ view }: { view: StudioView }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = useCallback(async () => {
    dispatch({ type: "loading" });
    const user = await getCurrentCollectionUser();
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const [productsResponse, collections] = await Promise.all([
      fetch("/api/studio/products", {
        headers: { authorization: `Bearer ${sessionData.session.access_token}` },
      }),
      listCreatorCollections(),
    ]);

    const productsPayload = (await productsResponse.json()) as {
      products?: PublishedArtwork[];
      error?: string;
    };
    if (!productsResponse.ok || !productsPayload.products) {
      throw new Error(productsPayload.error ?? "Unable to load studio products.");
    }

    dispatch({ type: "ready", products: productsPayload.products, collections });
  }, [pathname, router]);

  useEffect(() => {
    void load().catch((cause) => {
      dispatch({
        type: "error",
        message: cause instanceof Error ? cause.message : "Unable to load Studio.",
      });
    });
  }, [load]);

  const closeEditor = useCallback(() => dispatch({ type: "close-editor" }), []);
  const published = state.products.filter((product) => product.status === "published").length;
  const selectedCollectionId =
    state.editor?.mode === "edit" ? state.editor.collectionId : null;
  const selectedCollection = selectedCollectionId
    ? state.collections.find((collection) => collection.id === selectedCollectionId) ?? null
    : null;

  return (
    <main className="creator-studio creator-studio-immersive relative min-h-screen overflow-hidden text-white">
      <CreatorSpatialScene />
      <div className="creator-ambient-orb creator-ambient-orb-a" />
      <div className="creator-ambient-orb creator-ambient-orb-b" />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_15%_25%,rgba(139,92,246,0.08),transparent_28%),radial-gradient(circle_at_80%_75%,rgba(34,211,238,0.07),transparent_30%)]" />

      <div className="relative z-10 mx-auto min-h-screen w-full max-w-7xl px-5 py-5 sm:px-8 sm:py-7">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-black/25 px-3 py-2 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/10 hover:text-white" aria-label="Home">
              <ArrowLeft className="size-4" />
            </Link>
            <Link href="/studio" className="hidden items-center gap-2 px-2 text-xs font-semibold tracking-[0.18em] text-white/75 sm:flex">
              <Orbit className="size-4 text-violet-200" />
              EVERIE STUDIO
            </Link>
          </div>

          <nav className="order-3 flex w-full items-center justify-center gap-1 sm:order-none sm:w-auto">
            <Link href="/studio" className={navClass(view === "overview")}>OVERVIEW</Link>
            <Link href="/studio/products" className={navClass(view === "products")}>PRODUCTS</Link>
            <Link href="/studio/collections" className={navClass(view === "collections")}>COLLECTIONS</Link>
          </nav>

          <Link href="/create">
            <Button className="rounded-full bg-white text-black hover:bg-white/90">
              <Plus className="size-4" />
              Add product
            </Button>
          </Link>
        </header>

        {state.phase !== "ready" ? (
          <section className="flex min-h-[70vh] items-center justify-center">
            {state.phase === "error" ? (
              <div className="max-w-md rounded-[2rem] border border-rose-300/15 bg-black/55 p-6 text-center backdrop-blur-xl">
                <p className="text-sm text-rose-200">{state.error}</p>
                <Button onClick={() => void load()} className="mt-4 bg-white text-black">Try again</Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-white/45">
                <LoaderCircle className="size-4 animate-spin" />
                Loading your studio…
              </div>
            )}
          </section>
        ) : (
          <>
            {view === "overview" && (
              <section className="pb-16 pt-16 sm:pt-24">
                <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-violet-200/55">
                      <Sparkles className="size-4" /> Your studio
                    </p>
                    <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.055em] sm:text-7xl">
                      Everything you create,<br />in one place.
                    </h1>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      [state.products.length, "Products", Boxes],
                      [published, "Live", CircleDot],
                      [state.collections.length, "Collections", Layers3],
                    ].map(([value, label, Icon]) => {
                      const MetricIcon = Icon as typeof Boxes;
                      return (
                        <div key={String(label)} className="rounded-[1.6rem] border border-white/10 bg-black/35 p-4 backdrop-blur-xl">
                          <MetricIcon className="size-4 text-white/35" />
                          <p className="mt-8 text-3xl font-semibold tracking-tight">{String(value)}</p>
                          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-white/30">{String(label)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-14 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                  <div className="rounded-[2rem] border border-white/10 bg-black/28 p-5 backdrop-blur-xl sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/30">Recent products</p>
                        <h2 className="mt-1 text-xl font-medium">Products</h2>
                      </div>
                      <Link href="/studio/products" className="text-xs text-white/50 hover:text-white">View all →</Link>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {state.products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
                      {state.products.length === 0 && <p className="col-span-2 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35">No products yet. Add your first AR product.</p>}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-black/28 p-5 backdrop-blur-xl sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/30">Collections</p>
                        <h2 className="mt-1 text-xl font-medium">Collections</h2>
                      </div>
                      <Link href="/studio/collections" className="text-xs text-white/50 hover:text-white">View all →</Link>
                    </div>
                    <div className="mt-5 space-y-3">
                      {state.collections.slice(0, 4).map((collection) => (
                        <Link
                          key={collection.id}
                          href="/studio/collections"
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4 transition hover:bg-white/[0.05]"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white/80">{collection.name}</p>
                            <p className="mt-1 text-xs text-white/28">{statusLabel(collection.status)}</p>
                          </div>
                          <span className="text-[0.62rem] uppercase tracking-[0.14em] text-white/25">{collection.artworkIds.length} items</span>
                        </Link>
                      ))}
                      {state.collections.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-7 text-center text-sm text-white/35">No collections yet.</p>}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {view === "products" && (
              <section className="pb-16 pt-14 sm:pt-20">
                <div className="flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/45">Your products</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Products</h1>
                  </div>
                  <Link href="/create"><Button className="rounded-full bg-white text-black"><Plus className="size-4" />New product</Button></Link>
                </div>
                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {state.products.map((product) => <ProductCard key={product.id} product={product} />)}
                  {state.products.length === 0 && <div className="sm:col-span-2 lg:col-span-3 rounded-[2rem] border border-dashed border-white/10 bg-black/25 p-12 text-center text-white/35 backdrop-blur-xl"><ImageIcon className="mx-auto size-6" /><p className="mt-3 text-sm">No products yet.</p></div>}
                </div>
              </section>
            )}

            {view === "collections" && (
              <section className="pb-16 pt-14 sm:pt-20">
                <div className="flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-violet-200/45">Your collections</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Collections</h1>
                    <p className="mt-3 text-sm text-white/35">
                      {state.collections.length} collection{state.collections.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => dispatch({ type: "open-create" })}
                    className="rounded-full bg-white text-black hover:bg-white/90"
                  >
                    <Plus className="size-4" />
                    New collection
                  </Button>
                </div>

                {state.collections.length > 0 ? (
                  <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {state.collections.map((collection) => (
                      <CollectionCard
                        key={collection.id}
                        collection={collection}
                        products={state.products}
                        onOpen={() => dispatch({ type: "open-edit", collectionId: collection.id })}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-10 flex min-h-[20rem] flex-col items-center justify-center rounded-[2.3rem] border border-dashed border-white/10 bg-black/24 px-6 text-center backdrop-blur-xl">
                    <div className="flex size-16 items-center justify-center rounded-[1.6rem] border border-violet-200/12 bg-violet-300/8 text-violet-100/45">
                      <Layers3 className="size-6" />
                    </div>
                    <h2 className="mt-5 text-xl font-medium">Create your first collection</h2>
                    <Button
                      type="button"
                      onClick={() => dispatch({ type: "open-create" })}
                      className="mt-5 rounded-full bg-white text-black hover:bg-white/90"
                    >
                      <Plus className="size-4" />
                      New collection
                    </Button>
                  </div>
                )}
              </section>
            )}

            <CollectionEditorModal
              open={state.editor !== null}
              collection={selectedCollection}
              products={state.products}
              onClose={closeEditor}
              onSaved={(collection) => dispatch({ type: "collection-saved", collection })}
              onDeleted={(collectionId) => dispatch({ type: "collection-deleted", collectionId })}
            />
          </>
        )}
      </div>
    </main>
  );
}
