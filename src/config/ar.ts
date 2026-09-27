const overlayVideoUrl = process.env.NEXT_PUBLIC_AR_OVERLAY_VIDEO_URL?.trim();

export const arConfig = {
  targetUrl:
    process.env.NEXT_PUBLIC_AR_TARGET_URL ??
    "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind",
  targetImageUrl:
    process.env.NEXT_PUBLIC_AR_TARGET_IMAGE_URL ??
    "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png",
  targetIndex: Number(process.env.NEXT_PUBLIC_AR_TARGET_INDEX ?? 0),
  overlay: overlayVideoUrl
    ? {
        kind: "video" as const,
        url: overlayVideoUrl,
        aspectRatio: Number(process.env.NEXT_PUBLIC_AR_OVERLAY_ASPECT_RATIO ?? 1.8116),
      }
    : { kind: "procedural" as const },
} as const;
