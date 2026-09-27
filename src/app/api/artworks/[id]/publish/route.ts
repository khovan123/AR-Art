import { NextResponse } from "next/server";

import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { publishArtwork } = createArtworkServices();
    const artwork = await publishArtwork.execute(id);

    return NextResponse.json({
      artwork,
      sharePath: `/art/${artwork.slug}`,
      arPath: `/ar/${artwork.slug}`,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to publish artwork.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
