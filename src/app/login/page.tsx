import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { Button } from "@/components/atoms/button";
import { AuthForm } from "@/features/auth/presentation/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060609] px-5 py-6 text-white sm:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:30px_30px]" />
      <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <Link href="/">
          <Button
            variant="outline"
            className="border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Home
          </Button>
        </Link>

        <section className="flex min-h-[calc(100vh-6rem)] items-center justify-center py-12">
          <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-violet-200/55">
                <Sparkles className="size-4" aria-hidden="true" />
                Everie Collection
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[0.95] tracking-[-0.045em] sm:text-6xl">
                Lưu bộ sưu tập vào tài khoản của bạn.
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
                Đăng nhập trước khi quét. Khi AR nhận diện thành công một sản phẩm, item tương ứng sẽ được lưu vào Collection trên cloud của tài khoản Everie.
              </p>
            </div>

            <AuthForm nextPath={next} />
          </div>
        </section>
      </div>
    </main>
  );
}
