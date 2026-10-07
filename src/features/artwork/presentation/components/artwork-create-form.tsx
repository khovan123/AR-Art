"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useReducer } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import QRCode from "qrcode";
import {
  Box,
  Check,
  Copy,
  Download,
  ImagePlus,
  Layers3,
  LoaderCircle,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

import { BackLink } from "@/components/atoms/back-link";
import { Button } from "@/components/atoms/button";
import { EverieBrand } from "@/components/atoms/everie-brand";
import { Input } from "@/components/atoms/input";
import type { ArtworkArMode, ArtworkUploadSession } from "@/features/artwork/domain/artwork";
import {
  ARTWORK_UPLOAD_MAX_FILE_SIZE,
  artworkCreateFormSchema,
  type ArtworkCreateFormValues,
} from "@/features/artwork/domain/artwork-create-form-schema";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import { ArCompositionPreview } from "@/features/artwork/presentation/components/ar-composition-preview";
import { CreatorSpatialScene } from "@/features/artwork/presentation/components/creator-spatial-scene";
import { compileMindTarget } from "@/features/artwork/presentation/lib/compile-mind-target";
import { readImageAspectRatio } from "@/features/artwork/presentation/lib/read-image-aspect-ratio";
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

const AR_MODE_OPTIONS: Array<{
  value: ArtworkArMode;
  title: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  {
    value: "motion_extract",
    title: "Animate existing artwork",
    description: "Upload the full animation. Everie keeps the still artwork and reveals only what moves.",
    icon: Sparkles,
  },
  {
    value: "transparent_motion",
    title: "Transparent motion",
    description: "Upload an animation containing only the elements that should appear in AR.",
    icon: Video,
  },
  {
    value: "spatial_layers",
    title: "Layered AR",
    description: "Build the scene from separate images, videos, or a 3D model with independent depth and motion.",
    icon: Layers3,
  },
];

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
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

function isVideo(file: File) {
  return file.type.startsWith("video/");
}

function isImage(file: File) {
  return file.type.startsWith("image/");
}

function isModel(file: File) {
  return file.type === "model/gltf-binary" || file.name.toLowerCase().endsWith(".glb");
}

function layerKind(file: File) {
  if (isModel(file)) return "3D";
  if (isVideo(file)) return "Video";
  return "Image";
}

async function readLayerAspectRatio(file: File) {
  if (isVideo(file)) return readVideoAspectRatio(file);
  if (isImage(file)) return readImageAspectRatio(file);
  return undefined;
}

export function ArtworkCreateForm() {
  const [workflow, dispatch] = useReducer(workflowReducer, initialWorkflowState);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ArtworkCreateFormValues>({
    resolver: zodResolver(artworkCreateFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      artistName: "",
      arMode: "motion_extract",
      overlayVideo: undefined,
      spatialLayers: [],
    },
  });

  const {
    fields: spatialFields,
    append: appendSpatialLayer,
    remove: removeSpatialLayer,
  } = useFieldArray({ control, name: "spatialLayers" });

  const title = useWatch({ control, name: "title" });
  const artistName = useWatch({ control, name: "artistName" });
  const arMode = useWatch({ control, name: "arMode" });
  const targetImage = useWatch({ control, name: "targetImage" });
  const overlayVideo = useWatch({ control, name: "overlayVideo" });
  const spatialLayers = useWatch({ control, name: "spatialLayers" }) ?? [];

  const detailsReady = Boolean(title?.trim() && artistName?.trim());
  const arReady = arMode === "spatial_layers" ? spatialLayers.length > 0 : Boolean(overlayVideo);
  const canPublish = isValid && !isSubmitting;

  async function getAuthHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    return { authorization: `Bearer ${data.session.access_token}` };
  }

  async function createSession(
    values: ArtworkCreateFormValues,
    targetAspectRatio: number,
    overlayAspectRatio: number | undefined,
    layerAspectRatios: Array<number | undefined>,
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
        targetAspectRatio,
        arMode: values.arMode,
        ...(values.overlayVideo
          ? {
              overlayExtension: fileExtension(values.overlayVideo),
              overlayAspectRatio,
            }
          : {}),
        spatialLayers:
          values.arMode === "spatial_layers"
            ? values.spatialLayers.map((layer, index) => ({
                extension: fileExtension(layer.file),
                mimeType: layer.file.type || "application/octet-stream",
                aspectRatio: layerAspectRatios[index],
                x: layer.x,
                y: layer.y,
                depth: layer.depth,
                scale: layer.scale,
                animation: layer.animation,
                blendMode: layer.blendMode,
              }))
            : [],
      }),
    });

    const data = (await response.json()) as ArtworkUploadSession & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Unable to prepare uploads.");
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
    const qrDataUrl = await QRCode.toDataURL(arUrl, {
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

  async function runWorkflow(values: ArtworkCreateFormValues, intent: "draft" | "publish") {
    dispatch({ type: "start" });

    try {
      dispatch({ type: "message", message: "Checking your AR assets…" });
      const targetAspectRatio = await readImageAspectRatio(values.targetImage);
      const overlayAspectRatio = values.overlayVideo
        ? await readVideoAspectRatio(values.overlayVideo)
        : undefined;
      const layerAspectRatios = await Promise.all(
        values.spatialLayers.map((layer) => readLayerAspectRatio(layer.file)),
      );

      dispatch({ type: "message", message: "Preparing your artwork…" });
      const targetMind = await compileMindTarget(values.targetImage, (value) =>
        dispatch({ type: "compiler-progress", value }),
      );

      if (targetMind.size > ARTWORK_UPLOAD_MAX_FILE_SIZE) {
        throw new Error("The compiled tracking file is larger than the 6 MB MVP limit.");
      }

      dispatch({ type: "message", message: "Getting things ready…" });
      const session = await createSession(
        values,
        targetAspectRatio,
        overlayAspectRatio,
        layerAspectRatios,
      );

      dispatch({ type: "message", message: "Uploading your files…" });
      await uploadArtworkAssets(
        session,
        {
          targetImage: values.targetImage,
          targetMind,
          overlay: values.overlayVideo,
          spatialLayers: values.spatialLayers.map((layer) => layer.file),
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
        message: cause instanceof Error ? cause.message : "Unable to publish artwork.",
      });
    }
  }

  const publish = handleSubmit((values) => runWorkflow(values, "publish"));
  const saveDraft = handleSubmit((values) => runWorkflow(values, "draft"));

  async function copyShareUrl() {
    if (!workflow.result?.shareUrl) return;
    await navigator.clipboard.writeText(workflow.result.shareUrl);
    dispatch({ type: "copied", value: true });
    window.setTimeout(() => dispatch({ type: "copied", value: false }), 1600);
  }

  function addSpatialFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = Math.max(0, 12 - spatialFields.length);
    const nextFiles = Array.from(files).slice(0, remaining);
    nextFiles.forEach((file, offset) => {
      const index = spatialFields.length + offset;
      appendSpatialLayer({
        file,
        animation: isModel(file) ? "rotate" : isImage(file) ? "float" : "none",
        blendMode: "normal",
        x: 0,
        y: 0,
        depth: Math.min(0.05 + index * 0.025, 0.4),
        scale: isModel(file) ? 0.3 : 0.5,
      });
    });
    window.setTimeout(() => void trigger("spatialLayers"), 0);
  }

  if (workflow.result) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
        <div className="pointer-events-none absolute right-[8%] top-24 size-80 rounded-full bg-violet-700/7 blur-[130px]" />
        <header className="relative mx-auto grid w-full max-w-[94rem] grid-cols-[1fr_auto_1fr] items-center border-b border-white/10 px-5 py-5 sm:px-8 lg:px-12">
          <BackLink href="/studio/products" label="Products" />
          <EverieBrand />
          <span aria-hidden="true" />
        </header>

        <section className="relative mx-auto grid min-h-[calc(100svh-4.8rem)] w-full max-w-[94rem] items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-20">
          <div>
            <h1 className="max-w-3xl font-serif text-6xl leading-[0.88] tracking-[-0.055em] sm:text-8xl">
              {workflow.result.status === "published" ? (
                <>Ready for<br /><span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">the wall.</span></>
              ) : (
                <>Ready when<br /><span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">you are.</span></>
              )}
            </h1>

            {workflow.result.shareUrl ? (
              <div className="mt-10 border-t border-white/10 pt-4">
                <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/28">Artwork link</p>
                <p className="mt-2 break-all text-sm text-white/58">{workflow.result.shareUrl}</p>
              </div>
            ) : (
              <p className="mt-8 max-w-xl text-sm leading-6 text-white/45">
                Your artwork and AR experience are uploaded and kept private. Open the product in Studio whenever you are ready to publish it.
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {workflow.result.shareUrl ? (
                <>
                  <button type="button" onClick={copyShareUrl} className="inline-flex h-12 items-center gap-2 rounded-[4px] bg-white px-5 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-violet-100">
                    {workflow.copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {workflow.copied ? "Copied" : "Copy link"}
                  </button>
                  {workflow.result.qrDataUrl ? (
                    <a href={workflow.result.qrDataUrl} download="everie-qr.png" className="inline-flex h-12 items-center gap-2 rounded-[4px] bg-white/[0.035] px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/58 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.06] hover:text-white hover:ring-white/20">
                      <Download className="size-4" /> Download QR
                    </a>
                  ) : null}
                  <a href={workflow.result.shareUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-[4px] bg-white/[0.035] px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/58 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.06] hover:text-white hover:ring-white/20">
                    Open work
                  </a>
                </>
              ) : (
                <Link href="/studio/products" className="inline-flex h-12 items-center rounded-[4px] bg-white px-5 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-violet-100">
                  Manage draft
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-[8px] bg-[#09090d]/88 p-8 shadow-[0_35px_120px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/[0.06] sm:p-12">
            {workflow.result.qrDataUrl ? (
              <div className="mx-auto max-w-sm p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={workflow.result.qrDataUrl} alt="QR code for the published AR artwork" className="aspect-square w-full rounded-[5px] bg-white p-3" />
                <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4 text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                  <EverieBrand href={null} className="opacity-70" textClassName="text-[0.58rem]" iconClassName="size-3.5" /><span>Scan to enter AR</span>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[24rem] flex-col items-center justify-center rounded-[6px] bg-white/[0.02] px-8 text-center">
                <Check className="size-7 text-cyan-100/65" />
                <p className="mt-5 font-serif text-3xl">Saved privately.</p>
                <p className="mt-3 max-w-xs text-sm leading-6 text-white/35">QR and public sharing become available when you publish this product from Studio.</p>
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
      <header className="relative mx-auto grid w-full max-w-[94rem] grid-cols-[1fr_auto_1fr] items-center border-b border-white/10 px-5 py-5 sm:px-8 lg:px-12">
        <BackLink href="/studio/products" label="Studio" />
        <EverieBrand />
        <span aria-hidden="true" />
      </header>

      <section className="relative mx-auto w-full max-w-[94rem] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <h1 className="max-w-5xl font-serif text-6xl leading-[0.86] tracking-[-0.055em] sm:text-8xl lg:text-9xl">
          Give the work<br /><span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">another layer.</span>
        </h1>

        <div className="mt-12 grid grid-cols-4 gap-5 border-t border-white/10 pt-4">
          {[
            ["01", "Details", detailsReady],
            ["02", "Artwork", Boolean(targetImage)],
            ["03", "AR layer", arReady],
            ["04", "Publish", canPublish],
          ].map(([number, label, ready]) => (
            <div
              key={String(label)}
              className={`min-w-0 py-2 ${ready ? "text-white" : "text-white/28"}`}
            >
              <p className="text-[0.55rem] tabular-nums tracking-[0.14em] opacity-55">{String(number)}</p>
              <p className="mt-1 truncate text-[0.58rem] font-medium uppercase tracking-[0.1em] sm:text-[0.62rem]">
                {String(label)}
              </p>
              <div className="mt-2 h-px bg-white/10">
                <div className={`h-px transition-all duration-500 ${ready ? "w-full bg-violet-200" : "w-0"}`} />
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={publish}
          noValidate
          className="mt-6 grid overflow-hidden rounded-[8px] bg-[#07070a]/68 shadow-[0_36px_120px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-white/[0.06] lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="space-y-9 p-5 sm:p-7 lg:p-8">
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

            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.17em] text-white/35">AR experience</p>
              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                {AR_MODE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = arMode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setValue("arMode", option.value, { shouldDirty: true, shouldValidate: true });
                        void trigger();
                      }}
                      className={`min-h-40 rounded-[5px] p-5 text-left ring-1 ring-inset transition ${selected ? "bg-violet-200/[0.09] text-white ring-violet-200/24" : "bg-white/[0.025] text-white ring-white/[0.06] hover:bg-white/[0.055]"}`}
                    >
                      <Icon className="size-5" />
                      <p className="mt-8 font-serif text-xl">{option.title}</p>
                      <p className={`mt-2 text-xs leading-5 ${selected ? "text-white/58" : "text-white/36"}`}>{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <Controller name="targetImage" control={control} render={({ field: { onChange, onBlur, name, ref } }) => (
              <label className={`block cursor-pointer rounded-[5px] bg-white/[0.025] p-5 ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.05] ${errors.targetImage ? "text-rose-200" : ""}`}>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <ImagePlus className="size-5" />
                    <div><p className="font-serif text-2xl">Artwork image</p><p className="mt-1 text-xs text-white/36">{targetImage ? `${targetImage.name} · ${formatMb(targetImage.size)}` : "JPG, PNG or WebP · max 6 MB"}</p></div>
                  </div>
                </div>
                <input ref={ref} name={name} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onBlur={onBlur} onChange={(event) => onChange(event.target.files?.[0] ?? undefined)} />
                {errors.targetImage?.message ? <p className="mt-3 text-xs text-rose-200/80">{errors.targetImage.message}</p> : null}
              </label>
            )} />

            {arMode !== "spatial_layers" ? (
              <Controller name="overlayVideo" control={control} render={({ field: { onChange, onBlur, name, ref } }) => (
                <label className={`block cursor-pointer rounded-[5px] bg-white/[0.025] p-5 ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.05] ${errors.overlayVideo ? "text-rose-200" : ""}`}>
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <Video className="size-5" />
                      <div>
                        <p className="font-serif text-2xl">{arMode === "motion_extract" ? "Full artwork animation" : "Transparent motion"}</p>
                        <p className="mt-1 text-xs text-white/36">{overlayVideo ? `${overlayVideo.name} · ${formatMb(overlayVideo.size)}` : "MP4 or WebM · use the same proportions as the artwork"}</p>
                      </div>
                    </div>
                  </div>
                  <input ref={ref} name={name} type="file" accept="video/mp4,video/webm" className="sr-only" onBlur={onBlur} onChange={(event) => onChange(event.target.files?.[0] ?? undefined)} />
                  {errors.overlayVideo?.message ? <p className="mt-3 text-xs text-rose-200/80">{errors.overlayVideo.message}</p> : null}
                </label>
              )} />
            ) : (
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center justify-between gap-6 rounded-[5px] border border-dashed border-white/14 bg-white/[0.02] p-5 transition hover:border-white/28 hover:bg-white/[0.04]">
                  <div className="flex items-center gap-4">
                    <Layers3 className="size-5" />
                    <div>
                      <p className="font-serif text-2xl">Add AR layers</p>
                      <p className="mt-1 text-xs text-white/36">PNG, JPG, WebP, MP4, WebM or GLB · up to 12 layers</p>
                    </div>
                  </div>
                  <span className="text-[0.62rem] uppercase tracking-[0.15em] text-white/28">{spatialFields.length}/12</span>
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,.glb,model/gltf-binary" className="sr-only" onChange={(event) => { addSpatialFiles(event.target.files); event.currentTarget.value = ""; }} />
                </label>

                {spatialFields.map((field, index) => {
                  const layer = spatialLayers[index];
                  if (!layer) return null;
                  return (
                    <div key={field.id} className="rounded-[5px] bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.06]">
                      <Controller name={`spatialLayers.${index}.file`} control={control} render={() => <></>} />
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white/78">{layer.file.name}</p>
                          <p className="mt-1 text-[0.62rem] uppercase tracking-[0.14em] text-white/30">{layerKind(layer.file)} layer</p>
                        </div>
                        <button type="button" aria-label={`Remove ${layer.file.name}`} onClick={() => { removeSpatialLayer(index); window.setTimeout(() => void trigger("spatialLayers"), 0); }} className="p-2 text-white/35 transition hover:text-rose-200">
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="text-[0.62rem] uppercase tracking-[0.12em] text-white/32">
                          Motion
                          <select {...register(`spatialLayers.${index}.animation`)} className="mt-1 h-9 w-full rounded-[4px] border border-white/10 bg-black px-2 text-xs normal-case tracking-normal text-white/70">
                            <option value="none">Still</option><option value="float">Float</option><option value="pulse">Pulse</option><option value="rotate">Rotate</option><option value="orbit">Orbit</option>
                          </select>
                        </label>
                        <label className="text-[0.62rem] uppercase tracking-[0.12em] text-white/32">
                          Blend
                          <select {...register(`spatialLayers.${index}.blendMode`)} className="mt-1 h-9 w-full rounded-[4px] border border-white/10 bg-black px-2 text-xs normal-case tracking-normal text-white/70">
                            <option value="normal">Normal</option><option value="additive">Glow</option>
                          </select>
                        </label>
                        <label className="text-[0.62rem] uppercase tracking-[0.12em] text-white/32">Scale<Input type="number" step="0.05" {...register(`spatialLayers.${index}.scale`, { valueAsNumber: true })} className="mt-1 h-9 border-white/10 bg-black text-xs" /></label>
                        <label className="text-[0.62rem] uppercase tracking-[0.12em] text-white/32">X<Input type="number" step="0.05" {...register(`spatialLayers.${index}.x`, { valueAsNumber: true })} className="mt-1 h-9 border-white/10 bg-black text-xs" /></label>
                        <label className="text-[0.62rem] uppercase tracking-[0.12em] text-white/32">Y<Input type="number" step="0.05" {...register(`spatialLayers.${index}.y`, { valueAsNumber: true })} className="mt-1 h-9 border-white/10 bg-black text-xs" /></label>
                        <label className="text-[0.62rem] uppercase tracking-[0.12em] text-white/32">Depth<Input type="number" step="0.01" {...register(`spatialLayers.${index}.depth`, { valueAsNumber: true })} className="mt-1 h-9 border-white/10 bg-black text-xs" /></label>
                      </div>
                    </div>
                  );
                })}
                {errors.spatialLayers?.message ? <p className="text-xs text-rose-200/80">{errors.spatialLayers.message}</p> : null}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-5 border-t border-white/12 pt-5">
              <p className="max-w-sm text-xs leading-5 text-white/32">
                Publish creates a public artwork page and a QR that opens the AR camera directly. Collection happens only after target recognition.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" disabled={!canPublish} onClick={() => void saveDraft()} className="h-12 border-white/12 bg-transparent px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/55 hover:bg-white/[0.05] hover:text-white disabled:opacity-30">
                  {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Save draft
                </Button>
                <Button type="submit" disabled={!canPublish} className="h-12 bg-white px-6 text-xs font-medium uppercase tracking-[0.12em] text-black hover:bg-violet-100 disabled:bg-white/10 disabled:text-white/25">
                  {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {isSubmitting ? "Working…" : "Publish and get QR"}
                </Button>
              </div>
            </div>

            {workflow.message ? <p className={`text-sm ${isSubmitting ? "text-white/40" : "text-rose-200/80"}`} role="status">{workflow.message}</p> : null}
          </div>

          <aside className="relative min-h-[34rem] overflow-hidden border-t border-white/10 bg-[#09090d] text-white lg:border-l lg:border-t-0">
            {targetImage ? (
              <ArCompositionPreview
                targetImage={targetImage}
                arMode={arMode}
                overlayVideo={overlayVideo}
                spatialLayers={spatialLayers}
              />
            ) : (
              <CreatorSpatialScene />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/78 via-black/5 to-black/20" />
            <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8">
              {arMode === "spatial_layers" ? (
                <div className="mt-6 flex items-center gap-3 border-t border-white/15 pt-4 text-xs text-white/45"><Box className="size-4" /><span>{spatialLayers.length} spatial layer{spatialLayers.length === 1 ? "" : "s"}</span></div>
              ) : null}
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
