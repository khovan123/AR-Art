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
  QrCode,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
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
  shareUrl: string;
  arUrl: string;
  qrDataUrl: string;
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

    return { shareUrl, arUrl, qrDataUrl };
  }

  const submit = handleSubmit(async (values) => {
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

      dispatch({
        type: "message",
        message: "Finishing up…",
      });
      const published = await publishArtwork(session);
      dispatch({ type: "success", result: published });
    } catch (cause) {
      dispatch({
        type: "error",
        message:
          cause instanceof Error
            ? cause.message
            : "Unable to publish artwork.",
      });
    }
  });

  async function copyShareUrl() {
    if (!workflow.result) return;
    await navigator.clipboard.writeText(workflow.result.shareUrl);
    dispatch({ type: "copied", value: true });
    window.setTimeout(
      () => dispatch({ type: "copied", value: false }),
      1600,
    );
  }

  if (workflow.result) {
    return (
      <main className="creator-studio creator-studio-immersive relative min-h-screen overflow-hidden px-5 py-6 text-white sm:px-8">
        <CreatorSpatialScene />
        <div className="creator-ambient-orb creator-ambient-orb-a" />
        <div className="creator-ambient-orb creator-ambient-orb-b" />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <Link href="/studio/products" className="inline-flex">
            <Button
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Products
            </Button>
          </Link>

          <section className="creator-panel creator-panel-3d creator-enter creator-enter-delay-1 mx-auto mt-12 grid max-w-5xl gap-8 rounded-[2.4rem] p-6 sm:p-9 md:grid-cols-[1.08fr_0.92fr]">
            <div>
              <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                <Check className="mr-1 size-3" aria-hidden="true" />
                Live
              </Badge>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight">
                Your artwork is live.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
                Place this QR next to your artwork.
              </p>

              <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">
                  Artwork link
                </p>
                <p className="mt-2 break-all text-sm text-white/80">
                  {workflow.result.shareUrl}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  className="bg-white text-black hover:bg-white/90"
                  onClick={copyShareUrl}
                >
                  {workflow.copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {workflow.copied ? "Copied" : "Copy link"}
                </Button>
                <a href={workflow.result.qrDataUrl} download="ar-art-qr.png">
                  <Button
                    variant="outline"
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Download className="size-4" />
                    Download QR
                  </Button>
                </a>
                <a
                  href={workflow.result.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    variant="outline"
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    Open artwork
                  </Button>
                </a>
              </div>
            </div>

            <div className="creator-stage relative flex min-h-[24rem] items-center justify-center rounded-[2rem] p-8">
              {/* Generated data URL is intentionally rendered without next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={workflow.result.qrDataUrl}
                alt="QR code for the published AR artwork"
                className="relative z-10 aspect-square w-full max-w-64 rounded-2xl bg-white p-3 shadow-2xl"
              />
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="creator-studio creator-studio-immersive relative min-h-screen overflow-hidden">
      <CreatorSpatialScene />
      <div className="creator-ambient-orb creator-ambient-orb-a" />
      <div className="creator-ambient-orb creator-ambient-orb-b" />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_70%_40%,transparent_0%,rgba(5,5,10,0.18)_38%,rgba(5,5,10,0.82)_100%)]" />
      <div className="relative z-10 mx-auto w-full max-w-[90rem] px-5 py-6 lg:px-10">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button
              variant="ghost"
              className="text-white/60 hover:bg-white/[0.06] hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Studio
            </Button>
          </Link>
          <Badge className="border-white/10 bg-white/[0.04] text-white/55">
            NEW AR ARTWORK
          </Badge>
        </div>

        <section className="mx-auto mt-12 max-w-6xl">
          <div className="creator-enter max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-violet-300/65">
              New artwork
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
              Add your artwork. Bring it to life with AR.
            </h1>
          </div>

          <form
            onSubmit={submit}
            noValidate
            className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div className="creator-panel creator-panel-3d creator-enter creator-enter-delay-1 rounded-[2rem] p-5 sm:p-7">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="title">Artwork title</Label>
                  <Input
                    id="title"
                    maxLength={120}
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? "title-error" : undefined}
                    placeholder="e.g. Neon Saigon"
                    {...register("title")}
                  />
                  {errors.title?.message && (
                    <p id="title-error" className="text-xs text-rose-300">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="artistName">Artist / creator</Label>
                  <Input
                    id="artistName"
                    maxLength={120}
                    aria-invalid={Boolean(errors.artistName)}
                    aria-describedby={
                      errors.artistName ? "artist-name-error" : undefined
                    }
                    placeholder="Artist name"
                    {...register("artistName")}
                  />
                  {errors.artistName?.message && (
                    <p id="artist-name-error" className="text-xs text-rose-300">
                      {errors.artistName.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Controller
                    name="targetImage"
                    control={control}
                    render={({ field: { onChange, onBlur, name, ref } }) => (
                      <label
                        className={`creator-file-card group cursor-pointer rounded-2xl border border-dashed p-4 transition ${
                          targetImage ? "is-ready" : ""
                        } ${errors.targetImage ? "border-rose-300/40" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] text-white/70">
                            <ImagePlus className="size-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">Artwork image</p>
                            <p className="truncate text-xs text-white/40">
                              {targetImage
                                ? `${targetImage.name} · ${formatMb(targetImage.size)}`
                                : "JPG, PNG or WebP · max 6 MB"}
                            </p>
                          </div>
                        </div>
                        <input
                          ref={ref}
                          name={name}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          aria-invalid={Boolean(errors.targetImage)}
                          onBlur={onBlur}
                          onChange={(event) =>
                            onChange(event.target.files?.[0] ?? undefined)
                          }
                        />
                        {errors.targetImage?.message && (
                          <p className="mt-2 text-xs text-rose-300">
                            {errors.targetImage.message}
                          </p>
                        )}
                      </label>
                    )}
                  />

                  <Controller
                    name="overlayVideo"
                    control={control}
                    render={({ field: { onChange, onBlur, name, ref } }) => (
                      <label
                        className={`creator-file-card group cursor-pointer rounded-2xl border border-dashed p-4 transition ${
                          overlayVideo ? "is-ready" : ""
                        } ${errors.overlayVideo ? "border-rose-300/40" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] text-white/70">
                            <Video className="size-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">AR video</p>
                            <p className="truncate text-xs text-white/40">
                              {overlayVideo
                                ? `${overlayVideo.name} · ${formatMb(overlayVideo.size)}`
                                : "MP4 or WebM · max 6 MB"}
                            </p>
                          </div>
                        </div>
                        <input
                          ref={ref}
                          name={name}
                          type="file"
                          accept="video/mp4,video/webm"
                          className="sr-only"
                          aria-invalid={Boolean(errors.overlayVideo)}
                          onBlur={onBlur}
                          onChange={(event) =>
                            onChange(event.target.files?.[0] ?? undefined)
                          }
                        />
                        {errors.overlayVideo?.message && (
                          <p className="mt-2 text-xs text-rose-300">
                            {errors.overlayVideo.message}
                          </p>
                        )}
                      </label>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={!canPublish}
                  className={`creator-publish-button w-full ${
                    canPublish ? "is-ready" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Upload className="size-4" aria-hidden="true" />
                  )}
                  {isSubmitting ? "Publishing…" : "Publish and get QR"}
                </Button>

                <div className="creator-readiness flex items-center justify-between gap-3 text-xs">
                  <span className={detailsReady ? "is-ready" : ""}>
                    <Check className="size-3.5" aria-hidden="true" />
                    Details
                  </span>
                  <span className={targetImage ? "is-ready" : ""}>
                    <Check className="size-3.5" aria-hidden="true" />
                    Artwork
                  </span>
                  <span className={overlayVideo ? "is-ready" : ""}>
                    <Check className="size-3.5" aria-hidden="true" />
                    Animation
                  </span>
                </div>

                {workflow.message && (
                  <p
                    className={
                      isSubmitting
                        ? "text-sm text-white/40"
                        : "text-sm text-rose-300"
                    }
                    role="status"
                  >
                    {workflow.message}
                  </p>
                )}
              </div>
            </div>

            <aside className="creator-stage creator-panel-3d creator-enter creator-enter-delay-2 rounded-[2rem] p-5 text-white sm:p-7">
              <div className="flex items-center gap-2">
                <Sparkles
                  className="size-4 text-amber-300"
                  aria-hidden="true"
                />
                <p className="relative z-10 text-sm font-medium">
                  Publishing sequence
                </p>
              </div>

              <ol className="relative z-10 mt-8 grid gap-5">
                {[
                  ["Compile target", "Your artwork becomes a MindAR image target."],
                  [
                    "Upload assets",
                    "Image, tracking file, and video go to object storage.",
                  ],
                  [
                    "Publish page",
                    "A shareable artwork page and AR route are created.",
                  ],
                  [
                    "Generate QR",
                    "The QR opens the public artwork page on any phone.",
                  ],
                ].map(([name, detail], index) => {
                  const completed =
                    workflow.compilerProgress === 100 && index === 0
                      ? true
                      : workflow.uploadStep >= index &&
                        index > 0 &&
                        workflow.uploadStep > 0;

                  return (
                    <li key={name} className="flex gap-3">
                      <span
                        className={
                          completed
                            ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-black"
                            : "flex size-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs text-white/60"
                        }
                      >
                        {completed ? (
                          <Check className="size-4" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="mt-1 text-xs leading-5 text-white/50">
                          {detail}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {isSubmitting &&
                workflow.compilerProgress > 0 &&
                workflow.compilerProgress < 100 && (
                  <div className="mt-7">
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Tracking compiler</span>
                      <span>{workflow.compilerProgress}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white transition-[width]"
                        style={{ width: `${workflow.compilerProgress}%` }}
                      />
                    </div>
                  </div>
                )}

              <div className="relative z-10 mt-8 rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-sm">
                  <QrCode className="size-4" aria-hidden="true" />
                  Visitor flow
                </div>
                <p className="mt-2 text-xs leading-5 text-white/50">
                  QR → artwork information → Start AR → camera → point at the physical
                  artwork → animation locks onto it.
                </p>
              </div>
            </aside>
          </form>
        </section>
      </div>
    </main>
  );
}
