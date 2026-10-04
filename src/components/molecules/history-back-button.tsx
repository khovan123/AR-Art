"use client";

import type { ComponentProps, ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/atoms/button";

type HistoryBackButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  fallbackHref: string;
  children: ReactNode;
};

export function HistoryBackButton({
  fallbackHref,
  children,
  ...buttonProps
}: HistoryBackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <Button {...buttonProps} onClick={goBack}>
      {children}
    </Button>
  );
}
