"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  LoaderCircle,
  Pencil,
  QrCode,
  ScanLine,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useReducer, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";
import { Modal } from "@/components/molecules/modal";
import type { PublishedArtwork } from "@/features/artwork/domain/artwork";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import {
  studioProductSchema,
  type StudioProductFormValues,
} from "@/features/studio/domain/studio-product-schema";

type DeleteState = { confirming: boolean; deleting: boolean };
type DeleteAction = "ask" | "cancel" | "deleting" | "reset";

function deleteReducer(_state: DeleteState, action: DeleteAction): DeleteState {
  if (action === "ask") return { confirming: true, deleting: false };
  if (action === "deleting") return { confirming: true, deleting: true };
  return { confirming: false, deleting: false };
}

async function authHeaders() {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Please sign in again to manage this product.");
  return { authorization: `Bearer ${data.session.access_token}` };
}

export function ProductManagerModal({
  product,
  collectionCount,
  onClose,
  onSaved,
  onDeleted,
}: {
  product: PublishedArtwork | null;
  collectionCount: number;
  onClose: () => void;
  onSaved: (product: PublishedArtwork) => void;
  onDeleted: (productId: string) => void;
}) {
  const [deleteState, dispatchDelete] = useReducer(deleteReducer, {
    confirming: false,
    deleting: false,
  });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<StudioProductFormValues>({
    resolver: zodResolver(studioProductSchema),
    mode: "onChange",
    defaultValues: {
      title: product?.title ?? "",
      artistName: product?.artistName ?? "",
      description: product?.description ?? "",
      status: product?.status ?? "draft",
    },
  });

  const currentStatus = useWatch({ control, name: "status" });

  useEffect(() => {
    if (!product) return;
    reset({
      title: product.title,
      artistName: product.artistName,
      description: product.description,
      status: product.status,
    });
    dispatchDelete("reset");
  }, [product, reset]);

  const publicPath = product ? `/art/${product.slug}` : null;

  useEffect(() => {
    let active = true;
    if (!publicPath || product?.status !== "published") return;

    const absoluteUrl = new URL(publicPath, window.location.origin).toString();
    void QRCode.toDataURL(absoluteUrl, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "M",
    }).then((value) => {
      if (active) setQrDataUrl(value);
    });

    return () => {
      active = false;
    };
  }, [product?.status, publicPath]);

  const submit = handleSubmit(async (values) => {
    if (!product) return;
    try {
      const headers = await authHeaders();
      const response = await fetch(`/api/studio/products/${product.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        product?: PublishedArtwork;
        error?: string;
      };
      if (!response.ok || !payload.product) {
        throw new Error(payload.error ?? "Unable to update product.");
      }
      onSaved(payload.product);
    } catch (cause) {
      setError("root", {
        message: cause instanceof Error ? cause.message : "Unable to update product.",
      });
    }
  });

  async function removeProduct() {
    if (!product) return;
    if (!deleteState.confirming) {
      dispatchDelete("ask");
      return;
    }

    dispatchDelete("deleting");
    try {
      const headers = await authHeaders();
      const response = await fetch(`/api/studio/products/${product.id}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to delete product.");
      }
      onDeleted(product.id);
    } catch (cause) {
      dispatchDelete("reset");
      setError("root", {
        message: cause instanceof Error ? cause.message : "Unable to delete product.",
      });
    }
  }

  async function copyLink() {
    if (!publicPath) return;
    const absoluteUrl = new URL(publicPath, window.location.origin).toString();
    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (!product) return null;

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow="Manage product"
      title={product.title}
      icon={<Pencil className="size-4" />}
      maxWidthClassName="max-w-5xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleteState.deleting || isSubmitting}
              onClick={() => void removeProduct()}
              className={
                deleteState.confirming
                  ? "rounded-none border-rose-300/25 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15 hover:text-rose-100"
                  : "rounded-none border-white/10 bg-transparent text-white/42 hover:bg-white/[0.05] hover:text-rose-200"
              }
            >
              {deleteState.deleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {deleteState.confirming ? "Confirm delete" : "Delete"}
            </Button>
            {deleteState.confirming && !deleteState.deleting ? (
              <button
                type="button"
                onClick={() => dispatchDelete("cancel")}
                className="text-xs text-white/40 transition hover:text-white"
              >
                Cancel
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-none border-white/10 bg-transparent text-white/55 hover:bg-white/[0.06] hover:text-white"
            >
              Close
            </Button>
            <Button
              type="submit"
              form="studio-product-manager-form"
              disabled={!isValid || isSubmitting || deleteState.deleting}
              className="rounded-none bg-white text-black hover:bg-violet-100"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Save changes
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <form id="studio-product-manager-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="manage-product-title" className="text-white/68">
              Product name
            </Label>
            <Input
              id="manage-product-title"
              className="h-11 rounded-none border-white/10 bg-white/[0.045] text-white"
              {...register("title")}
            />
            {errors.title ? <p className="text-xs text-rose-300">{errors.title.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="manage-product-artist" className="text-white/68">
              Creator
            </Label>
            <Input
              id="manage-product-artist"
              className="h-11 rounded-none border-white/10 bg-white/[0.045] text-white"
              {...register("artistName")}
            />
            {errors.artistName ? (
              <p className="text-xs text-rose-300">{errors.artistName.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="manage-product-description" className="text-white/68">
              Description
            </Label>
            <Textarea
              id="manage-product-description"
              rows={5}
              className="rounded-none border-white/10 bg-white/[0.045] text-white"
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-xs text-rose-300">{errors.description.message}</p>
            ) : null}
          </div>

          <div>
            <Label className="text-white/68">Visibility</Label>
            <div className="mt-2 grid grid-cols-2 gap-px border border-white/10 bg-white/10 p-px">
              <button
                type="button"
                onClick={() =>
                  setValue("status", "draft", { shouldValidate: true, shouldDirty: true })
                }
                className={`px-4 py-2.5 text-sm transition ${
                  currentStatus === "draft"
                    ? "bg-white text-black"
                    : "bg-[#09090d] text-white/45 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() =>
                  setValue("status", "published", { shouldValidate: true, shouldDirty: true })
                }
                className={`px-4 py-2.5 text-sm transition ${
                  currentStatus === "published"
                    ? "bg-white text-black"
                    : "bg-[#09090d] text-white/45 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                Live
              </button>
            </div>
          </div>

          {errors.root?.message ? (
            <p className="border border-rose-300/15 bg-rose-400/8 px-3 py-2.5 text-sm text-rose-200">
              {errors.root.message}
            </p>
          ) : null}
        </form>

        <aside className="border-t border-white/14 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="flex items-center justify-between gap-4 border-b border-white/12 pb-4">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/28">
                Distribution
              </p>
              <p className="mt-1 text-sm text-white/58">
                {collectionCount} collection{collectionCount === 1 ? "" : "s"}
              </p>
            </div>
            <span
              className={`border px-2 py-1 text-[0.58rem] uppercase tracking-[0.16em] ${
                product.status === "published"
                  ? "border-emerald-300/18 bg-emerald-300/10 text-emerald-100/75"
                  : "border-white/10 text-white/42"
              }`}
            >
              {product.status === "published" ? "Live" : "Draft"}
            </span>
          </div>

          {product.status === "published" && publicPath ? (
            <div className="pt-6">
              {qrDataUrl ? (
                <div className="mx-auto max-w-[14rem] border border-white/12 bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt={`QR code for ${product.title}`}
                    className="aspect-square w-full"
                  />
                </div>
              ) : (
                <div className="mx-auto flex aspect-square max-w-[14rem] items-center justify-center border border-white/12 text-white/25">
                  <QrCode className="size-7" />
                </div>
              )}

              <p className="mt-5 break-all border-y border-white/10 py-3 text-xs leading-5 text-white/38">
                {publicPath}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void copyLink()}
                  className="rounded-none border-white/12 bg-transparent text-white/58 hover:bg-white/[0.05] hover:text-white"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
                {qrDataUrl ? (
                  <a
                    href={qrDataUrl}
                    download={`everie-${product.slug}-qr.png`}
                    className="inline-flex h-9 items-center justify-center gap-2 border border-white/12 px-3 text-sm text-white/58 transition hover:border-white/35 hover:text-white"
                  >
                    <Download className="size-4" /> Download QR
                  </a>
                ) : null}
                <a
                  href={`/art/${product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-2 border border-white/12 px-3 text-sm text-white/58 transition hover:border-white/35 hover:text-white"
                >
                  <ExternalLink className="size-4" /> Open work
                </a>
                <a
                  href={`/ar/${product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-2 border border-white/12 px-3 text-sm text-white/58 transition hover:border-white/35 hover:text-white"
                >
                  <ScanLine className="size-4" /> Open AR
                </a>
              </div>
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <QrCode className="size-6 text-white/22" />
              <p className="mt-4 text-sm font-medium text-white/68">
                Distribution unlocks when this product is live.
              </p>
              <p className="mt-2 max-w-xs text-xs leading-5 text-white/32">
                Keep it private while you refine details, then switch Visibility to Live and save.
              </p>
            </div>
          )}
        </aside>
      </div>
    </Modal>
  );
}
