import { notFound } from "next/navigation";

import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";
import { ArViewer } from "@/features/ar-experience/presentation/components/ar-viewer";

export const dynamic = "force-dynamic";

export default async function PublishedArPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { getPublishedArtwork } = createArtworkServices();
  const artwork = await getPublishedArtwork.execute(slug);

  if (!artwork) notFound();

  return (
    <ArViewer
      backHref={`/art/${artwork.slug}`}
      config={{
        targetUrl: artwork.targetFileUrl,
        targetIndex: 0,
        overlay: {
          kind: "video",
          url: artwork.overlayUrl,
          aspectRatio: artwork.overlayAspectRatio,
        },
      }}
      artwork={{
        slug: artwork.slug,
        title: artwork.title,
        artistName: artwork.artistName,
      }}
    />
  );
}
