"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { CreatorSpatialScene } from "@/features/artwork/presentation/components/creator-spatial-scene";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";
import type { ArtworkUploadSession } from "@/features/artwork/domain/artwork";
import { compileMindTarget } from "@/features/artwork/presentation/lib/compile-mind-target";
import { readVideoAspectRatio } from "@/features/artwork/presentation/lib/read-video-aspect-ratio";
import { uploadArtworkAssets } from "@/features/artwork/presentation/lib/upload-artwork-assets";

const MAX_FILE_SIZE = 6 * 1024 * 1024;
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const videoTypes = new Set(["video/mp4", "video/webm"]);

type PublishResult = {
  shareUrl: string;
  arUrl: string;
  qrDataUrl: string;
};

function fileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function formatMb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ArtworkCreateForm() {
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [description, setDescription] = useState("");
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [overlayVideo, setOverlayVideo] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "working" | "done">("idle");
  const [compilerProgress, setCompilerProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [copied, setCopied] = useState(false);

  const canPublish = useMemo(
    () =>
      title.trim().length > 0 &&
      artistName.trim().length > 0 &&
      targetImage !== null &&
      overlayVideo !== null &&
      status !== "working",
    [artistName, overlayVideo, status, targetImage, title],
  );

  function validateFiles(image: File, video: File) {
    if (!imageTypes.has(image.type)) {
      throw new Error("Target image must be JPG, PNG, or WebP.");
    }
    if (!videoTypes.has(video.type)) {
      throw new Error("AR overlay must be MP4 or WebM.");
    }
    if (image.size > MAX_FILE_SIZE || video.size > MAX_FILE_SIZE) {
      throw new Error("Each uploaded file must be 6 MB or smaller for this MVP.");
    }
  }

  async function createSession(aspectRatio: number) {
    const response = await fetch("/api/artworks/drafts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        artistName,
        description,
        targetImageExtension: fileExtension(targetImage!),
        overlayExtension: fileExtension(overlayVideo!),
        overlayAspectRatio: aspectRatio,
      }),
    });

    const data = (await response.json()) as ArtworkUploadSession & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Unable to prepare uploads.");
    return data;
  }

  async function publishArtwork(session: ArtworkUploadSession) {
    const response = await fetch(`/api/artworks/${session.artworkId}/publish`, {
      method: "POST",
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!targetImage || !overlayVideo) return;

    setMessage(null);
    setResult(null);
    setStatus("working");
    setCompilerProgress(0);
    setUploadStep(0);

    try {
      validateFiles(targetImage, overlayVideo);
      setMessage("Reading AR video…");
      const aspectRatio = await readVideoAspectRatio(overlayVideo);

      setMessage("Building image-tracking data in your browser…");
      const targetMind = await compileMindTarget(targetImage, setCompilerProgress);

      if (targetMind.size > MAX_FILE_SIZE) {
        throw new Error("The compiled tracking file is larger than the 6 MB MVP limit.");
      }

      setMessage("Preparing secure upload slots…");
      const session = await createSession(aspectRatio);

      setMessage("Uploading artwork assets…");
      await uploadArtworkAssets(
        session,
        { targetImage, targetMind, overlay: overlayVideo },
        setUploadStep,
      );

      setMessage("Publishing and generating QR code…");
      const published = await publishArtwork(session);
      setResult(published);
      setStatus("done");
      setMessage(null);
    } catch (cause) {
      setStatus("idle");
      setMessage(cause instanceof Error ? cause.message : "Unable to publish artwork.");
    }
  }

  async function copyShareUrl() {
    if (!result) return;
    await navigator.clipboard.writeText(result.shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (result) {
    return (
      <main className="creator-studio creator-studio-immersive relative min-h-screen overflow-hidden px-5 py-6 text-white sm:px-8">
        <CreatorSpatialScene />
        <div className="creator-ambient-orb creator-ambient-orb-a" />
        <div className="creator-ambient-orb creator-ambient-orb-b" />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <Link href="/" className="inline-flex">
            <Button
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Home
            </Button>
          </Link>

          <section className="creator-panel creator-panel-3d creator-enter creator-enter-delay-1 mx-auto mt-12 grid max-w-5xl gap-8 rounded-[2.4rem] p-6 sm:p-9 md:grid-cols-[1.08fr_0.92fr]">
            <div>
              <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                <Check className="mr-1 size-3" aria-hidden="true" />
                Published
              </Badge>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight">
                Your artwork is ready to scan.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
                Print or display this QR beside the physical artwork. Visitors open the
                artwork page first, then launch the AR camera from there.
              </p>

              <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">
                  Share URL
                </p>
                <p className="mt-2 break-all text-sm text-white/80">{result.shareUrl}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  className="bg-white text-black hover:bg-white/90"
                  onClick={copyShareUrl}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <a href={result.qrDataUrl} download="ar-art-qr.png">
                  <Button
                    variant="outline"
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Download className="size-4" />
                    Download QR
                  </Button>
                </a>
                <a href={result.shareUrl} target="_blank" rel="noreferrer">
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
                src={result.qrDataUrl}
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
            <Button variant="ghost" className="text-white/60 hover:bg-white/[0.06] hover:text-white">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Home
            </Button>
          </Link>
          <Badge className="border-white/10 bg-white/[0.04] text-white/55">CREATOR STUDIO</Badge>
        </div>

        <section className="mx-auto mt-12 max-w-6xl">
          <div className="creator-enter max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-violet-300/65">Build a spatial artwork</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
              Upload once. Put the QR beside the artwork.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/45">
              The tracking file is generated automatically in your browser. Your original
              artwork image, tracking data, and AR video are then uploaded directly to
              storage using short-lived signed upload tokens.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div className="creator-panel creator-panel-3d creator-enter creator-enter-delay-1 rounded-[2rem] p-5 sm:p-7">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="title">Artwork title</Label>
                  <Input
                    id="title"
                    value={title}
                    maxLength={120}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Neon Saigon"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="artist">Artist / creator</Label>
                  <Input
                    id="artist"
                    value={artistName}
                    maxLength={120}
                    onChange={(event) => setArtistName(event.target.value)}
                    placeholder="Artist name"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    maxLength={1200}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What should visitors know about this piece?"
                  />
                  <p className="text-right text-xs text-white/40">
                    {description.length}/1200
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={`creator-file-card group cursor-pointer rounded-2xl border border-dashed p-4 transition ${targetImage ? "is-ready" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] text-white/70">
                        <ImagePlus className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Tracking artwork</p>
                        <p className="truncate text-xs text-white/40">
                          {targetImage
                            ? `${targetImage.name} · ${formatMb(targetImage.size)}`
                            : "JPG, PNG or WebP · max 6 MB"}
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => setTargetImage(event.target.files?.[0] ?? null)}
                    />
                  </label>

                  <label
                    className={`creator-file-card group cursor-pointer rounded-2xl border border-dashed p-4 transition ${overlayVideo ? "is-ready" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] text-white/70">
                        <Video className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">AR animation</p>
                        <p className="truncate text-xs text-white/40">
                          {overlayVideo
                            ? `${overlayVideo.name} · ${formatMb(overlayVideo.size)}`
                            : "MP4 or WebM · max 6 MB"}
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      className="sr-only"
                      onChange={(event) => setOverlayVideo(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={!canPublish}
                  className={`creator-publish-button w-full ${canPublish ? "is-ready" : ""}`}
                >
                  {status === "working" ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="size-4" aria-hidden="true" />
                  )}
                  {status === "working" ? "Publishing…" : "Publish & generate QR"}
                </Button>

                <div className="creator-readiness flex items-center justify-between gap-3 text-xs">
                  <span className={title.trim() && artistName.trim() ? "is-ready" : ""}>
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

                {message && (
                  <p
                    className={
                      status === "working"
                        ? "text-sm text-white/40"
                        : "text-sm text-rose-300"
                    }
                    role="status"
                  >
                    {message}
                  </p>
                )}
              </div>
            </div>

            <aside className="creator-stage creator-panel-3d creator-enter creator-enter-delay-2 rounded-[2rem] p-5 text-white sm:p-7">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-300" aria-hidden="true" />
                <p className="relative z-10 text-sm font-medium">Publishing sequence</p>
              </div>

              <ol className="relative z-10 mt-8 grid gap-5">
                {[
                  ["Compile target", "Your artwork becomes a MindAR image target."],
                  ["Upload assets", "Image, tracking file, and video go to object storage."],
                  ["Publish page", "A shareable artwork page and AR route are created."],
                  ["Generate QR", "The QR opens the public artwork page on any phone."],
                ].map(([name, detail], index) => {
                  const completed =
                    compilerProgress === 100 && index === 0
                      ? true
                      : uploadStep >= index && index > 0 && uploadStep > 0;

                  return (
                    <li key={name} className="flex gap-3">
                      <span
                        className={
                          completed
                            ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-black"
                            : "flex size-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs text-white/60"
                        }
                      >
                        {completed ? <Check className="size-4" /> : index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="mt-1 text-xs leading-5 text-white/50">{detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {status === "working" && compilerProgress > 0 && compilerProgress < 100 && (
                <div className="mt-7">
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Tracking compiler</span>
                    <span>{compilerProgress}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white transition-[width]"
                      style={{ width: `${compilerProgress}%` }}
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
