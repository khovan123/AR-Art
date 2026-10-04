import { CreateArtworkUploadSession } from "@/features/artwork/application/use-cases/create-artwork-upload-session";
import { GetPublishedArtwork } from "@/features/artwork/application/use-cases/get-published-artwork";
import { ListPublishedArtworks } from "@/features/artwork/application/use-cases/list-published-artworks";
import { ListStudioArtworks } from "@/features/artwork/application/use-cases/list-studio-artworks";
import { PublishArtwork } from "@/features/artwork/application/use-cases/publish-artwork";
import { UpdateStudioArtwork } from "@/features/artwork/application/use-cases/update-studio-artwork";
import { SupabaseArtworkRepository } from "@/features/artwork/infrastructure/supabase/supabase-artwork-repository";
import { SupabaseArtworkStorage } from "@/features/artwork/infrastructure/supabase/supabase-artwork-storage";
import { getArtworkBucketName } from "@/features/artwork/infrastructure/supabase/supabase-clients";

export function createArtworkServices() {
  const repository = new SupabaseArtworkRepository();
  const storage = new SupabaseArtworkStorage();

  return {
    createUploadSession: new CreateArtworkUploadSession(
      repository,
      storage,
      getArtworkBucketName(),
    ),
    publishArtwork: new PublishArtwork(repository, storage),
    getPublishedArtwork: new GetPublishedArtwork(repository, storage),
    listPublishedArtworks: new ListPublishedArtworks(repository, storage),
    listStudioArtworks: new ListStudioArtworks(repository, storage),
    updateStudioArtwork: new UpdateStudioArtwork(repository, storage),
  };
}
