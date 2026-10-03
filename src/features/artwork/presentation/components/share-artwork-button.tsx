"use client";

import { useState } from "react";
import { Check, Copy, ImageDown, Share2 } from "lucide-react";

import { Button } from "@/components/atoms/button";

interface ShareArtworkButtonProps {
  title: string;
  text?: string;
  imageUrl: string;
}

type Feedback = "copied" | "image-saved" | "error" | null;

function imageExtension(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

function safeFileName(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "everie-item";
}

export function ShareArtworkButton({
  title,
  text,
  imageUrl,
}: ShareArtworkButtonProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [sharingImage, setSharingImage] = useState(false);

  function showFeedback(value: Feedback) {
    setFeedback(value);
    window.setTimeout(() => setFeedback(null), 1800);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showFeedback("copied");
    } catch {
      showFeedback("error");
    }
  }

  async function sharePage() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      await copyLink();
    } catch {
      // Native share can be cancelled by the user.
    }
  }

  async function shareImage() {
    if (sharingImage) return;
    setSharingImage(true);

    try {
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Unable to load share image.");

      const blob = await response.blob();
      const extension = imageExtension(blob.type);
      const file = new File(
        [blob],
        `${safeFileName(title)}.${extension}`,
        { type: blob.type || "image/jpeg" },
      );

      if (
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          title,
          text,
          files: [file],
        });
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = file.name;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      showFeedback("image-saved");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      showFeedback("error");
    } finally {
      setSharingImage(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => void copyLink()}
        className="border-white/12 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white"
      >
        {feedback === "copied" ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
        {feedback === "copied" ? "Đã sao chép" : "Copy link"}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => void sharePage()}
        className="border-white/12 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white"
      >
        <Share2 className="size-4" aria-hidden="true" />
        Share page
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={sharingImage}
        onClick={() => void shareImage()}
        className="border-white/12 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white"
      >
        <ImageDown className="size-4" aria-hidden="true" />
        {sharingImage
          ? "Đang chuẩn bị ảnh…"
          : feedback === "image-saved"
            ? "Đã lưu ảnh"
            : "Share image"}
      </Button>

      {feedback === "error" && (
        <span className="text-xs text-red-200/70">Không thể chia sẻ lúc này.</span>
      )}
    </div>
  );
}
