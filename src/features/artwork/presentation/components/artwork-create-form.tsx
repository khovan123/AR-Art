"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useReducer } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ImagePlus,
  LoaderCircle,
  Upload,
  Video,
} from "lucide-react";

import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import type { ArtworkUploadSession } from "@/features/artwork/domain/artwork";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import {
  ARTWORK_UPLOAD_MAX_FILE_SIZE,
  artworkCreateFormSchema,
  type ArtworkCreateFormValues,
} from "@/features/artwork/domain/artwork-create-form-schema";
import { CreatorSpatialScene } from "@/features/artwork/presentation/components/creator-spatial-scene";
import { compileMindTarget } from "@/features/artwork/presentation/lib/compile-mind-target";
import { readVideoAspectRatio } from "@/features/artwork/presentation/lib/read-video-aspect-ratio";
import { uploadArtworkAssets } from "@/features/artwork/presentation/lib/upload-artwork-assets";

type PublishResult = {
  status: "draft" | "published";
  productId: string;
  shareUrl: string | null;
  arUrl: string | null;
  qrDataUrl: string | null;
};

type WorkflowState = {
  compilerProgress: number;
  uploadStep: number;
  message: string | null;
  result: PublishResult | null;
  copied: boolean;
};

type WorkflowAction =
  | { type: "start" }
  | { type: "message"; message: string }
  | { type: "compiler-progress"; value: number }
  | { type: "upload-step"; value: number }
  | { type: "success"; result: PublishResult }
  | { type: "error"; message: string }
  | { type: "copied"; value: boolean };

const initialWorkflowState: WorkflowState = {
  compilerProgress: 0,
  uploadStep: 0,
  message: null,
  result: null,
  copied: false,
};

function workflowReducer(
  state: WorkflowState,
  action: WorkflowAction,
): WorkflowState {
  switch (action.type) {
    case "start":
      return initialWorkflowState;
    case "message":
      return { ...state, message: action.message };
    case "compiler-progress":
      return { ...state, compilerProgress: action.value };
    case "upload-step":
      return { ...state, uploadStep: action.value };
    case "success":
      return { ...state, message: null, result: action.result };
    case "error":
      return { ...state, message: action.message };
    case "copied":
      return { ...state, copied: action.value };
  }
}

function fileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function formatMb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ArtworkCreateForm() {
  const [workflow, dispatch] = useReducer(
    workflowReducer,
    initialWorkflowState,
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ArtworkCreateFormValues>({
    resolver: zodResolver(artworkCreateFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      artistName: "",
    },
  });

  const title = useWatch({ control, name: "title" });
  const artistName = useWatch({ control, name: "artistName" });
  const targetImage = useWatch({ control, name: "targetImage" });
  const overlayVideo = useWatch({ control, name: "overlayVideo" });

  const detailsReady = Boolean(title?.trim() && artistName?.trim());
  const canPublish = isValid && !isSubmitting;

  async function getAuthHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    return {
      authorization: `Bearer ${data.session.access_token}`,
    };
  }

  async function createSession(
    values: ArtworkCreateFormValues,
    aspectRatio: number,
  ) {
    const authHeaders = await getAuthHeaders();
    const response = await fetch("/api/artworks/drafts", {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders },
      body: JSON.stringify({
        title: values.title,
        artistName: values.artistName,
        description: "",
        targetImageExtension: fileExtension(values.targetImage),
        overlayExtension: fileExtension(values.overlayVideo),
        overlayAspectRatio: aspectRatio,
      }),
    });

    const data = (await response.json()) as ArtworkUploadSession & {
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Unable to prepare uploads.");
    }
    return data;
  }

  async function publishArtwork(session: ArtworkUploadSession) {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`/api/artworks/${session.artworkId}/publish`, {
      method: "POST",
      headers: authHeaders,
    });
    const data = (await response.json()) as {
      sharePath?: string;
      arPath?: string;
      error?: string;
    };

    if (!response.ok || !data.sharePath || !data.arPath) {
      throw new Error(data.error ?? "Unable to publish artwork.");
    }

    const shareUrl = new URL(data.sharePath, window.location.origin).toString();
    const arUrl = new URL(data.arPath, window.location.origin).toString();
    const qrDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    return {
      status: "published" as const,
      productId: session.artworkId,
      shareUrl,
      arUrl,
      qrDataUrl,
    };
  }

  async function runWorkflow(
    values: ArtworkCreateFormValues,
    intent: "draft" | "publish",
  ) {
    dispatch({ type: "start" });

    try {
      dispatch({ type: "message", message: "Checking your video…" });
      const aspectRatio = await readVideoAspectRatio(values.overlayVideo);

      dispatch({
        type: "message",
        message: "Preparing your artwork…",
      });
      const targetMind = await compileMindTarget(
        values.targetImage,
        (value) => dispatch({ type: "compiler-progress", value }),
      );

      if (targetMind.size > ARTWORK_UPLOAD_MAX_FILE_SIZE) {
        throw new Error(
          "The compiled tracking file is larger than the 6 MB MVP limit.",
        );
      }

      dispatch({
        type: "message",
        message: "Getting things ready…",
      });
      const session = await createSession(values, aspectRatio);

      dispatch({ type: "message", message: "Uploading your files…" });
      await uploadArtworkAssets(
        session,
        {
          targetImage: values.targetImage,
          targetMind,
          overlay: values.overlayVideo,
        },
        (value) => dispatch({ type: "upload-step", value }),
      );

      if (intent === "draft") {
        dispatch({
          type: "success",
          result: {
            status: "draft",
            productId: session.artworkId,
            shareUrl: null,
            arUrl: null,
            qrDataUrl: null,
          },
        });
        return;
      }

      dispatch({ type: "message", message: "Finishing up…" });
      dispatch({ type: "success", result: await publishArtwork(session) });
    } catch (cause) {
      dispatch({
        type: "error",
        message:
          cause instanceof Error
            ? cause.message
            : "Unable to publish artwork.",
      });
    }
  }

  const publish = handleSubmit((values) => runWorkflow(values, "publish"));
  const saveDraft = handleSubmit((values) => runWorkflow(values, "draft"));

  async function copyShareUrl() {
    if (!workflow.result?.shareUrl) return;
    await navigator.clipboard.writeText(workflow.result.shareUrl);
    dispatch({ type: "copied", value: true });
    window.setTimeout(
      () => dispatch({ type: "copied", value: false }),
      1600,
    );
  }

  if (workflow.result) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
        <div className="pointer-events-none absolute right-[8%] top-24 size-80 rounded-full bg-violet-700/7 blur-[130px]" />
        <header className="relative mx-auto flex w-full max-w-[94rem] items-center justify-between border-b border-white/12 px-5 py-5 sm:px-8 lg:px-12">
          <Link href="/studio/products" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/50 transition hover:text-white">
            <ArrowLeft className="size-3.5" /> Products
          </Link>
          <span className="text-lg font-semibold tracking-[-0.045em]">EVERIE</span>
          <span className="text-[0.62rem] uppercase tracking-[0.18em] text-cyan-100/45">
            {workflow.result.status === "published" ? "Published" : "Draft saved"}
          </span>
        </header>

        <section className="relative mx-auto grid min-h-[calc(100svh-4.8rem)] w-full max-w-[94rem] items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-20">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-violet-200/45">
              {workflow.result.status === "published" ? "Work is live" : "Saved privately"}
            </p>
            <h1 className="mt-6 max-w-3xl font-serif text-6xl leading-[0.88] tracking-[-0.055em] sm:text-8xl">
              {workflow.result.status === "published" ? (
                <>
                  Ready for<br />
                  <span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">the wall.</span>
                </>
              ) : (
                <>
                  Ready when<br />
                  <span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">you are.</span>
                </>
              )}
            </h1>

            {workflow.result.shareUrl ? (
              <div className="mt-10 border-y border-white/12 py-4">
                <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/28">Artwork link</p>
                <p className="mt-2 break-all text-sm text-white/58">{workflow.result.shareUrl}</p>
              </div>
            ) : (
              <p className="mt-8 max-w-xl text-sm leading-6 text-white/45">
                Your artwork and AR layer are uploaded and kept private. Open the product in Studio whenever you are ready to publish it.
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {workflow.result.shareUrl ? (
                <>
                  <button type="button" onClick={copyShareUrl} className="inline-flex h-12 items-center gap-2 bg-white px-5 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-violet-100">
                    {workflow.copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {workflow.copied ? "Copied" : "Copy link"}
                  </button>
                  {workflow.result.qrDataUrl ? (
                    <a href={workflow.result.qrDataUrl} download="everie-qr.png" className="inline-flex h-12 items-center gap-2 border border-white/18 px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/58 transition hover:border-white/45 hover:text-white">
                      <Download className="size-4" /> Download QR
                    </a>
                  ) : null}
                  <a href={workflow.result.shareUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center border border-white/18 px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/58 transition hover:border-white/45 hover:text-white">
                    Open work
                  </a>
                </>
              ) : (
                <Link href="/studio/products" className="inline-flex h-12 items-center bg-white px-5 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-violet-100">
                  Manage draft
                </Link>
              )}
            </div>
          </div>

          <div className="border border-white/10 bg-[#09090d] p-8 shadow-[0_35px_120px_rgba(0,0,0,0.35)] sm:p-12">
            {workflow.result.qrDataUrl ? (
              <div className="mx-auto max-w-sm border border-white/12 p-7">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={workflow.result.qrDataUrl} alt="QR code for the published AR artwork" className="aspect-square w-full bg-white p-3" />
                <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4 text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                  <span>Everie</span><span>Scan to enter</span>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[24rem] flex-col items-center justify-center border border-white/12 px-8 text-center">
                <Check className="size-7 text-cyan-100/65" />
                <p className="mt-5 font-serif text-3xl">Saved privately.</p>
                <p className="mt-3 max-w-xs text-sm leading-6 text-white/35">
                  QR and public sharing become available when you publish this product from Studio.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none absolute right-[12%] top-28 size-80 rounded-full bg-violet-700/7 blur-[130px]" />
      <header className="relative mx-auto flex w-full max-w-[94rem] items-center justify-between border-b border-white/12 px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/studio/products" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/50 transition hover:text-white">
          <ArrowLeft className="size-3.5" /> Studio
        </Link>
        <span className="text-lg font-semibold tracking-[-0.045em]">EVERIE</span>
        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-white/28">New work</span>
      </header>

      <section className="relative mx-auto w-full max-w-[94rem] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.38fr_1.62fr]">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-violet-200/45">Publish / 01</p>
          <div>
            <h1 className="max-w-5xl font-serif text-6xl leading-[0.86] tracking-[-0.055em] sm:text-8xl lg:text-9xl">
              Give the work<br /><span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">another layer.</span>
            </h1>
          </div>
        </div>

        <form onSubmit={publish} noValidate className="mt-16 grid gap-10 border-t border-white/12 pt-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-9">
            <div className="grid gap-8 sm:grid-cols-2">
              <label className="block">
                <span className="text-[0.65rem] uppercase tracking-[0.17em] text-white/35">Artwork title</span>
                <Input id="title" maxLength={120} aria-invalid={Boolean(errors.title)} placeholder="e.g. Neon Saigon" {...register("title")} className="mt-3 h-12 rounded-none border-0 border-b border-white/18 bg-transparent px-0 text-base text-white shadow-none placeholder:text-white/18 focus-visible:border-cyan-200/70 focus-visible:ring-0" />
                {errors.title?.message ? <p className="mt-2 text-xs text-rose-200/80">{errors.title.message}</p> : null}
              </label>

              <label className="block">
                <span className="text-[0.65rem] uppercase tracking-[0.17em] text-white/35">Artist / creator</span>
                <Input id="artistName" maxLength={120} aria-invalid={Boolean(errors.artistName)} placeholder="Artist name" {...register("artistName")} className="mt-3 h-12 rounded-none border-0 border-b border-white/18 bg-transparent px-0 text-base text-white shadow-none placeholder:text-white/18 focus-visible:border-cyan-200/70 focus-visible:ring-0" />
                {errors.artistName?.message ? <p className="mt-2 text-xs text-rose-200/80">{errors.artistName.message}</p> : null}
              </label>
            </div>

            <div className="grid gap-px border border-white/12 bg-white/10 sm:grid-cols-2">
              <Controller name="targetImage" control={control} render={({ field: { onChange, onBlur, name, ref } }) => (
                <label className={`group min-h-48 cursor-pointer bg-[#09090d] p-5 transition hover:bg-white/[0.055] ${errors.targetImage ? "text-rose-200" : ""}`}>
                  <div className="flex h-full flex-col justify-between gap-10">
                    <div className="flex items-center justify-between"><ImagePlus className="size-5" /><span className="text-[0.62rem] uppercase tracking-[0.15em] text-white/28">01</span></div>
                    <div><p className="font-serif text-2xl">Artwork image</p><p className="mt-2 text-xs leading-5 text-white/36">{targetImage ? `${targetImage.name} · ${formatMb(targetImage.size)}` : "JPG, PNG or WebP · max 6 MB"}</p></div>
                  </div>
                  <input ref={ref} name={name} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onBlur={onBlur} onChange={(event) => onChange(event.target.files?.[0] ?? undefined)} />
                  {errors.targetImage?.message ? <p className="mt-2 text-xs text-rose-200/80">{errors.targetImage.message}</p> : null}
                </label>
              )} />

              <Controller name="overlayVideo" control={control} render={({ field: { onChange, onBlur, name, ref } }) => (
                <label className={`group min-h-48 cursor-pointer bg-[#09090d] p-5 transition hover:bg-white/[0.055] ${errors.overlayVideo ? "text-rose-200" : ""}`}>
                  <div className="flex h-full flex-col justify-between gap-10">
                    <div className="flex items-center justify-between"><Video className="size-5" /><span className="text-[0.62rem] uppercase tracking-[0.15em] text-white/28">02</span></div>
                    <div><p className="font-serif text-2xl">AR video</p><p className="mt-2 text-xs leading-5 text-white/36">{overlayVideo ? `${overlayVideo.name} · ${formatMb(overlayVideo.size)}` : "MP4 or WebM · max 6 MB"}</p></div>
                  </div>
                  <input ref={ref} name={name} type="file" accept="video/mp4,video/webm" className="sr-only" onBlur={onBlur} onChange={(event) => onChange(event.target.files?.[0] ?? undefined)} />
                  {errors.overlayVideo?.message ? <p className="mt-2 text-xs text-rose-200/80">{errors.overlayVideo.message}</p> : null}
                </label>
              )} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-5 border-y border-white/12 py-4">
              <div className="flex items-center gap-5 text-[0.62rem] uppercase tracking-[0.13em] text-white/28">
                <span className={detailsReady ? "text-white" : ""}>Details</span>
                <span className={targetImage ? "text-white" : ""}>Artwork</span>
                <span className={overlayVideo ? "text-white" : ""}>AR layer</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canPublish}
                  onClick={() => void saveDraft()}
                  className="h-12 rounded-none border-white/15 bg-transparent px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/55 hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
                >
                  {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Save draft
                </Button>
                <Button type="submit" disabled={!canPublish} className="h-12 rounded-none bg-white px-6 text-xs font-medium uppercase tracking-[0.12em] text-black hover:bg-violet-100 disabled:bg-white/10 disabled:text-white/25">
                  {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {isSubmitting ? "Working…" : "Publish and get QR"}
                </Button>
              </div>
            </div>

            {workflow.message ? <p className={`text-sm ${isSubmitting ? "text-white/40" : "text-rose-200/80"}`} role="status">{workflow.message}</p> : null}
          </div>

          <aside className="relative min-h-[34rem] overflow-hidden border border-white/10 bg-[#09090d] text-white">
            <CreatorSpatialScene />
            <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/5 to-black/20" />
            <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-white/45">From artwork to AR</p>
              <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/20 pt-4 text-xs uppercase tracking-[0.11em] text-white/58">
                <span>01 · Artwork</span><span>02 · AR layer</span><span>03 · Publish</span>
              </div>
              {isSubmitting && workflow.compilerProgress > 0 && workflow.compilerProgress < 100 ? (
                <div className="mt-6 border-t border-white/15 pt-4">
                  <div className="flex justify-between text-[0.62rem] uppercase tracking-[0.12em] text-white/45"><span>Preparing</span><span>{workflow.compilerProgress}%</span></div>
                  <div className="mt-2 h-px bg-white/15"><div className="h-px bg-cyan-100 transition-[width]" style={{ width: `${workflow.compilerProgress}%` }} /></div>
                </div>
              ) : null}
            </div>
          </aside>
        </form>
      </section>
    </main>
  );
}
