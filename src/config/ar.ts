const overlayVideoUrl = process.env.NEXT_PUBLIC_AR_OVERLAY_VIDEO_URL?.trim();
const targetImageUrl =
  process.env.NEXT_PUBLIC_AR_TARGET_IMAGE_URL ??
  "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png";

export const arConfig = {
  targetUrl:
    process.env.NEXT_PUBLIC_AR_TARGET_URL ??
    "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind",
  targetImageUrl,
  targetIndex: Number(process.env.NEXT_PUBLIC_AR_TARGET_INDEX ?? 0),
  overlay: overlayVideoUrl
    ? {
        kind: "motion-extract" as const,
        videoUrl: overlayVideoUrl,
        targetImageUrl,
        targetAspectRatio: Number(process.env.NEXT_PUBLIC_AR_TARGET_ASPECT_RATIO ?? 1.8116),
        thresholdLow: 0.08,
        thresholdHigh: 0.18,
      }
    : { kind: "procedural" as const },
} as const;
