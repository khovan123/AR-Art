import Link from "next/link";
import { ArrowLeft, ScanLine, Sparkles } from "lucide-react";

import { Button } from "@/components/atoms/button";
import { createArtworkServices } from "@/features/artwork/infrastructure/supabase/artwork-services";
import { CollectionGrid } from "@/features/collection/presentation/components/collection-grid";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const { listPublishedArtworks } = createArtworkServices();
  const artworks = await listPublishedArtworks.execute();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060609] px-5 py-6 text-white sm:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:30px_30px]" />
      <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/">
            <Button
              variant="outline"
              className="border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Home
            </Button>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Everie Collection
          </div>
        </header>

        <section className="pb-10 pt-16 sm:pt-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-violet-200/55">
              <ScanLine className="size-4" aria-hidden="true" />
              Physical × Digital
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.045em] sm:text-6xl">
              Bộ sưu tập Everie của bạn.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
              Mỗi sản phẩm Everie có một nội dung số riêng. Khi AR nhận diện đúng sản phẩm, item tương ứng được ghi nhận ngay vào Collection của tài khoản.
            </p>
            <p className="mt-3 text-xs leading-5 text-white/30">
              Collection được lưu trong database cloud theo tài khoản Everie, vì vậy bạn có thể đăng nhập lại trên thiết bị khác để xem bộ sưu tập đã mở khóa.
            </p>
          </div>
        </section>

        <CollectionGrid artworks={artworks} />
      </div>
    </main>
  );
}
