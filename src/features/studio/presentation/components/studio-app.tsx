"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  CircleDot,
  ImageIcon,
  LoaderCircle,
  Orbit,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/atoms/button";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import { CreatorSpatialScene } from "@/features/artwork/presentation/components/creator-spatial-scene";
import { getCurrentCollectionUser } from "@/features/collection/infrastructure/supabase/collection-repository";
import { ProductManagerModal } from "@/features/studio/presentation/components/product-manager-modal";

type StudioView = "overview" | "products";

type StudioState = {
  phase: "checking" | "loading" | "ready" | "error";
  products: PublishedArtwork[];
  error: string | null;
  productEditorId: string | null;
};

type StudioAction =
  | { type: "loading" }
  | { type: "ready"; products: PublishedArtwork[] }
  | { type: "product-saved"; product: PublishedArtwork }
  | { type: "product-deleted"; productId: string }
  | { type: "open-product"; productId: string }
  | { type: "close-product" }
  | { type: "error"; message: string };

const initialState: StudioState = {
  phase: "checking",
  products: [],
  error: null,
  productEditorId: null,
};

function reducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "loading":
      return { ...state, phase: "loading", error: null };
    case "ready":
      return {
        phase: "ready",
        products: action.products,
        error: null,
        productEditorId: state.productEditorId,
      };
    case "product-saved":
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.product.id ? action.product : product,
        ),
        productEditorId: action.product.id,
      };
    case "product-deleted":
      return {
        ...state,
        products: state.products.filter((product) => product.id !== action.productId),
        productEditorId: null,
      };
    case "open-product":
      return { ...state, productEditorId: action.productId };
    case "close-product":
      return { ...state, productEditorId: null };
    case "error":
      return { ...state, phase: "error", error: action.message };
  }
}

function navClass(active: boolean) {
  return `px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition ${
    active
      ? "bg-white text-black"
      : "bg-[#09090d] text-white/42 hover:bg-white/[0.055] hover:text-white/80"
  }`;
}

function productModeLabel(mode: PublishedArtwork["arMode"]) {
  if (mode === "transparent_motion") return "Transparent motion";
  if (mode === "spatial_layers") return "Layered AR";
  return "Animated artwork";
}

function ProductCard({
  product,
  onManage,
}: {
  product: PublishedArtwork;
  onManage: () => void;
}) {
  return (
    <article className="group relative border-t border-white/18 pt-3 transition duration-500 hover:border-white/45">
      <div className="relative aspect-[4/5] overflow-hidden bg-black/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.targetImageUrl}
          alt={product.title}
          className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.035] group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span
          className={`absolute left-3 top-3 border px-2 py-1 text-[0.58rem] uppercase tracking-[0.16em] backdrop-blur-md ${
            product.status === "published"
              ? "border-emerald-200/20 bg-emerald-300/10 text-emerald-100/78"
              : "border-white/16 bg-black/55 text-white/58"
          }`}
        >
          {product.status === "published" ? "Live" : "Draft"}
        </span>
      </div>
      <div className="border-b border-white/12 pb-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-medium text-white">{product.title}</h3>
            <p className="mt-1 truncate text-xs text-white/38">by {product.artistName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onManage}
              className="inline-flex h-9 items-center gap-2 border border-white/18 px-3 text-[0.62rem] uppercase tracking-[0.13em] text-white/50 transition hover:border-white/45 hover:text-white"
            >
              <Pencil className="size-3.5" />
              Manage
            </button>
            {product.status === "published" ? (
              <Link
                href={`/art/${product.slug}`}
                className="flex size-9 items-center justify-center border border-white/18 text-white/50 transition hover:border-white/45 hover:text-white"
                aria-label={`Open ${product.title}`}
              >
                <ArrowUpRight className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.58rem] uppercase tracking-[0.12em] text-white/26">
          <span>{productModeLabel(product.arMode)}</span>
          <span className="text-white/14">·</span>
          <span>{product.status === "draft" ? "Ready to continue" : "QR opens AR"}</span>
        </div>
      </div>
    </article>
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

    const productsResponse = await fetch("/api/studio/products", {
      headers: { authorization: `Bearer ${sessionData.session.access_token}` },
    });

    const productsPayload = (await productsResponse.json()) as {
      products?: PublishedArtwork[];
      error?: string;
    };
    if (!productsResponse.ok || !productsPayload.products) {
      throw new Error(productsPayload.error ?? "Unable to load studio products.");
    }

    dispatch({ type: "ready", products: productsPayload.products });
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
  const drafts = state.products.length - published;
  const selectedProduct = state.productEditorId
    ? state.products.find((product) => product.id === state.productEditorId) ?? null
    : null;

  return (
    <main className="creator-studio creator-studio-immersive relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-38"><CreatorSpatialScene /></div>
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/66" />

      <div className="relative z-10 mx-auto min-h-screen w-full max-w-[94rem] px-5 py-5 sm:px-8 lg:px-12">
        <header className="sticky top-3 z-30 flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-[#07070a]/82 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex size-9 items-center justify-center border border-white/15 text-white/52 transition hover:border-white/40 hover:text-white" aria-label="Home">
              <ArrowLeft className="size-4" />
            </Link>
            <Link href="/studio" className="hidden items-center gap-2 text-xs font-semibold tracking-[0.18em] text-white/75 sm:flex">
              <Orbit className="size-4 text-white/45" />
              EVERIE STUDIO
            </Link>
          </div>

          <nav className="order-3 flex w-full items-center justify-center gap-px border border-white/10 bg-white/10 p-px sm:order-none sm:w-auto">
            <Link href="/studio" className={navClass(view === "overview")}>OVERVIEW</Link>
            <Link href="/studio/products" className={navClass(view === "products")}>PRODUCTS</Link>
          </nav>

          <Link href="/create">
            <Button className="rounded-none bg-white px-5 text-black hover:bg-violet-100">
              <Plus className="size-4" />
              Add product
            </Button>
          </Link>
        </header>

        {state.phase !== "ready" ? (
          <section className="flex min-h-[70vh] items-center justify-center">
            {state.phase === "error" ? (
              <div className="max-w-md border border-rose-300/20 bg-black/65 p-6 text-center">
                <p className="text-sm text-rose-200">{state.error}</p>
                <Button onClick={() => void load()} className="mt-4 rounded-none bg-white text-black">Try again</Button>
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
                    <p className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.24em] text-violet-200/45">
                      <Sparkles className="size-4" /> Your studio
                    </p>
                    <h1 className="mt-6 max-w-4xl font-serif text-6xl font-normal leading-[0.86] tracking-[-0.055em] sm:text-8xl">
                      Everything you publish,<br /><span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">in one place.</span>
                    </h1>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      [state.products.length, "Products", Boxes],
                      [published, "Live", CircleDot],
                      [drafts, "Drafts", ImageIcon],
                    ].map(([value, label, Icon]) => {
                      const MetricIcon = Icon as typeof Boxes;
                      return (
                        <div key={String(label)} className="border-t border-white/18 py-4">
                          <MetricIcon className="size-4 text-white/35" />
                          <p className="mt-8 text-3xl font-semibold tracking-tight">{String(value)}</p>
                          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-white/30">{String(label)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-16 border-t border-white/18 pt-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/30">Recent products</p>
                      <h2 className="mt-1 text-xl font-medium">Products</h2>
                    </div>
                    <Link href="/studio/products" className="text-xs text-white/50 hover:text-white">View all →</Link>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {state.products.slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onManage={() => dispatch({ type: "open-product", productId: product.id })}
                      />
                    ))}
                    {state.products.length === 0 && (
                      <p className="col-span-full border-y border-dashed border-white/10 p-8 text-center text-sm text-white/35">
                        No products yet. Add your first AR product.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {view === "products" && (
              <section className="pb-16 pt-14 sm:pt-20">
                <div className="flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/45">Your products</p>
                    <h1 className="mt-4 font-serif text-6xl font-normal leading-none tracking-[-0.05em] sm:text-8xl">Products</h1>
                  </div>
                  <Link href="/create">
                    <Button className="rounded-none bg-white px-5 text-black hover:bg-violet-100">
                      <Plus className="size-4" /> New product
                    </Button>
                  </Link>
                </div>
                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {state.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onManage={() => dispatch({ type: "open-product", productId: product.id })}
                    />
                  ))}
                  {state.products.length === 0 && (
                    <div className="border-y border-dashed border-white/15 p-12 text-center text-white/35 sm:col-span-2 lg:col-span-3">
                      <ImageIcon className="mx-auto size-6" />
                      <p className="mt-3 text-sm">No products yet.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            <ProductManagerModal
              key={selectedProduct?.id ?? "no-product"}
              product={selectedProduct}
              onClose={() => dispatch({ type: "close-product" })}
              onSaved={(product) => dispatch({ type: "product-saved", product })}
              onDeleted={(productId) => dispatch({ type: "product-deleted", productId })}
            />
          </>
        )}
      </div>
    </main>
  );
}