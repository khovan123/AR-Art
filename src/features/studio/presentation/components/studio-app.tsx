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
  Orbit,
  Plus,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
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
  listCreatorCollections,
  type CreatorCollection,
} from "@/features/studio/infrastructure/supabase/studio-collection-repository";

type StudioView = "overview" | "products" | "collections";

type StudioState = {
  phase: "checking" | "loading" | "ready" | "error";
  products: PublishedArtwork[];
  collections: CreatorCollection[];
  error: string | null;
};

type StudioAction =
  | { type: "loading" }
  | { type: "ready"; products: PublishedArtwork[]; collections: CreatorCollection[] }
  | { type: "collection-added"; collection: CreatorCollection }
  | { type: "error"; message: string };

const initialState: StudioState = {
  phase: "checking",
  products: [],
  collections: [],
  error: null,
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
      };
    case "collection-added":
      return {
        ...state,
        collections: [action.collection, ...state.collections],
      };
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
          {product.status}
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

function CollectionCreatePanel({
  products,
  onCreated,
}: {
  products: PublishedArtwork[];
  onCreated: (collection: CreatorCollection) => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<StudioCollectionFormValues>({
    resolver: zodResolver(studioCollectionSchema),
    mode: "onChange",
    defaultValues: { name: "", productIds: [] },
  });

  const submit = handleSubmit(async (values) => {
    const collection = await createCreatorCollection(values);
    onCreated(collection);
    reset();
  });

  return (
    <form
      onSubmit={submit}
      className="rounded-[2rem] border border-white/12 bg-[#0a0a10]/72 p-5 shadow-[0_35px_100px_rgba(0,0,0,0.36)] backdrop-blur-2xl sm:p-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-300/10 text-violet-200">
          <FolderPlus className="size-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">New collection</p>
          <h2 className="mt-1 text-lg font-medium">Create collection</h2>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="collection-name" className="text-white/70">Collection name</Label>
          <Input
            id="collection-name"
            placeholder="e.g. Neon Series"
            className="mt-2 border-white/10 bg-white/[0.045] text-white"
            {...register("name")}
          />
          {errors.name && <p className="mt-1 text-xs text-rose-300">{errors.name.message}</p>}
        </div>

        <div>
          <p className="text-sm font-medium text-white/70">Products</p>
          <Controller
            control={control}
            name="productIds"
            render={({ field }) => (
              <div className="mt-2 max-h-52 space-y-2 overflow-y-auto pr-1">
                {products.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-white/35">
                    Add a product first.
                  </p>
                ) : (
                  products.map((product) => {
                    const selected = field.value.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            selected
                              ? field.value.filter((id) => id !== product.id)
                              : [...field.value, product.id],
                          )
                        }
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                          selected
                            ? "border-cyan-300/25 bg-cyan-300/10"
                            : "border-white/8 bg-white/[0.025] hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className={`flex size-6 items-center justify-center rounded-full border ${selected ? "border-cyan-200/40 bg-cyan-200 text-black" : "border-white/15 text-transparent"}`}>
                          <Check className="size-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-white/80">{product.title}</span>
                          <span className="text-[0.68rem] uppercase tracking-[0.14em] text-white/30">{product.status}</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="mt-6 w-full bg-white text-black hover:bg-white/90"
      >
        {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Create collection
      </Button>
    </form>
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

  const published = state.products.filter((product) => product.status === "published").length;

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
                      <Link href="/studio/collections" className="text-xs text-white/50 hover:text-white">Manage →</Link>
                    </div>
                    <div className="mt-5 space-y-3">
                      {state.collections.slice(0, 4).map((collection) => (
                        <div key={collection.id} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-white/80">{collection.name}</p>
                            <span className="text-[0.62rem] uppercase tracking-[0.14em] text-white/25">{collection.artworkIds.length} items</span>
                          </div>
                                                  </div>
                      ))}
                      {state.collections.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-7 text-center text-sm text-white/35">No creator collections yet.</p>}
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
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.24em] text-violet-200/45">Your collections</p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Collections</h1>
                </div>

                <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                  <div className="space-y-4">
                    {state.collections.map((collection) => (
                      <article key={collection.id} className="rounded-[2rem] border border-white/10 bg-black/32 p-5 backdrop-blur-xl sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[0.64rem] uppercase tracking-[0.16em] text-violet-200/45">{collection.status}</p>
                            <h2 className="mt-2 text-2xl font-medium tracking-tight">{collection.name}</h2>
                          </div>
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]">
                            <Layers3 className="size-5 text-white/45" />
                          </div>
                        </div>
                        <div className="mt-5 flex items-center gap-2 text-xs text-white/30">
                          <Boxes className="size-3.5" />
                          {collection.artworkIds.length} product{collection.artworkIds.length === 1 ? "" : "s"}
                        </div>
                      </article>
                    ))}
                    {state.collections.length === 0 && <div className="rounded-[2rem] border border-dashed border-white/10 bg-black/22 p-12 text-center text-white/35 backdrop-blur-xl"><Layers3 className="mx-auto size-6" /><p className="mt-3 text-sm">Create your first collection.</p></div>}
                  </div>

                  <CollectionCreatePanel
                    products={state.products}
                    onCreated={(collection) => dispatch({ type: "collection-added", collection })}
                  />
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
