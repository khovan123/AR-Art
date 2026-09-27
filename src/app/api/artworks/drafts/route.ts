import { NextResponse } from "next/server";

import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";

const imageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const videoExtensions = new Set(["mp4", "webm"]);

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const title = clean(body.title, 120);
    const artistName = clean(body.artistName, 120);
    const description = clean(body.description, 1200);
    const targetImageExtension = clean(body.targetImageExtension, 8).toLowerCase();
    const overlayExtension = clean(body.overlayExtension, 8).toLowerCase();
    const overlayAspectRatio = Number(body.overlayAspectRatio);

    if (!title || !artistName) {
      return NextResponse.json(
        { error: "Artwork title and artist name are required." },
        { status: 400 },
      );
    }

    if (!imageExtensions.has(targetImageExtension)) {
      return NextResponse.json({ error: "Unsupported target image format." }, { status: 400 });
    }

    if (!videoExtensions.has(overlayExtension)) {
      return NextResponse.json({ error: "Unsupported AR video format." }, { status: 400 });
    }

    if (!Number.isFinite(overlayAspectRatio) || overlayAspectRatio < 0.2 || overlayAspectRatio > 5) {
      return NextResponse.json({ error: "Invalid video aspect ratio." }, { status: 400 });
    }

    const { createUploadSession } = createArtworkServices();
    const session = await createUploadSession.execute({
      title,
      artistName,
      description,
      targetImageExtension: targetImageExtension as "jpg" | "jpeg" | "png" | "webp",
      overlayExtension: overlayExtension as "mp4" | "webm",
      overlayAspectRatio,
    });

    return NextResponse.json(session, { status: 201 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to create artwork.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
