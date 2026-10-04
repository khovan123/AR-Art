import { NextResponse } from "next/server";

import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";
import { getRequestUser } from "@/features/auth/infrastructure/supabase/request-user";
import { studioProductSchema } from "@/features/studio/domain/studio-product-schema";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const payload = studioProductSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid product details." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const { updateStudioArtwork } = createArtworkServices();
    const product = await updateStudioArtwork.execute(id, user.id, payload.data);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to update product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
