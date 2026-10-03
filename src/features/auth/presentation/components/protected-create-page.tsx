"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { ArtworkCreateForm } from "@/features/artwork/presentation/components/artwork-create-form";
import { getCurrentCollectionUser } from "@/features/collection/infrastructure/supabase/collection-repository";

type CreateAccessState = "checking" | "authenticated";

export function ProtectedCreatePage() {
  const router = useRouter();
  const [accessState, setAccessState] = useState<CreateAccessState>("checking");

  useEffect(() => {
    let active = true;

    async function verifyAccess() {
      const user = await getCurrentCollectionUser();
      if (!active) return;

      if (!user) {
        router.replace("/login?next=%2Fcreate");
        return;
      }

      setAccessState("authenticated");
    }

    void verifyAccess().catch(() => {
      if (active) router.replace("/login?next=%2Fcreate");
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (accessState !== "authenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="flex items-center gap-3 text-sm text-white/55">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Checking account…
        </div>
      </main>
    );
  }

  return <ArtworkCreateForm />;
}
