"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/atoms/button";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import {
  authFormSchema,
  type AuthFormValues,
} from "@/features/auth/domain/auth-form-schema";

interface AuthFormProps {
  nextPath?: string;
}

function sanitizeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/collection";
  }
  return value;
}

export function AuthForm({ nextPath }: AuthFormProps) {
  const router = useRouter();
  const redirectPath = sanitizeNextPath(nextPath);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      mode: "signin",
      email: "",
      password: "",
    },
  });

  const mode = useWatch({ control, name: "mode" });
  const serverMessage = errors.root?.server?.message;
  const successMessage = errors.root?.success?.message;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(redirectPath);
    });
  }, [redirectPath, router]);

  function changeMode(nextMode: AuthFormValues["mode"]) {
    setValue("mode", nextMode, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    clearErrors();
  }

  const submit = handleSubmit(async ({ email, password, mode: submitMode }) => {
    clearErrors("root");

    try {
      const supabase = getSupabaseBrowserClient();

      if (submitMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        router.replace(redirectPath);
        router.refresh();
        return;
      }

      const emailRedirectTo = `${window.location.origin}/login?next=${encodeURIComponent(redirectPath)}`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      });
      if (error) throw error;

      if (data.session) {
        router.replace(redirectPath);
        router.refresh();
        return;
      }

      setError("root.success", {
        type: "success",
        message:
          "Tài khoản đã được tạo. Hãy kiểm tra email để xác nhận, sau đó quay lại đăng nhập.",
      });
    } catch (cause) {
      setError("root.server", {
        type: "server",
        message:
          cause instanceof Error ? cause.message : "Không thể xác thực tài khoản.",
      });
    }
  });

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="flex rounded-full border border-white/10 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => changeMode("signin")}
          aria-pressed={mode === "signin"}
          className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
            mode === "signin" ? "bg-white text-black" : "text-white/55 hover:text-white"
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => changeMode("signup")}
          aria-pressed={mode === "signup"}
          className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
            mode === "signup" ? "bg-white text-black" : "text-white/55 hover:text-white"
          }`}
        >
          Tạo tài khoản
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <input type="hidden" {...register("mode")} />

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/35">Email</span>
          <input
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "auth-email-error" : undefined}
            {...register("email")}
            className={`h-12 w-full rounded-xl border bg-black/25 px-4 text-sm text-white outline-none transition placeholder:text-white/25 ${
              errors.email
                ? "border-red-300/40 focus:border-red-200/70"
                : "border-white/10 focus:border-white/30"
            }`}
            placeholder="you@example.com"
          />
          {errors.email?.message && (
            <p id="auth-email-error" className="mt-2 text-xs text-red-200/75">
              {errors.email.message}
            </p>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/35">Mật khẩu</span>
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "auth-password-error" : undefined}
            {...register("password")}
            className={`h-12 w-full rounded-xl border bg-black/25 px-4 text-sm text-white outline-none transition placeholder:text-white/25 ${
              errors.password
                ? "border-red-300/40 focus:border-red-200/70"
                : "border-white/10 focus:border-white/30"
            }`}
            placeholder="Tối thiểu 6 ký tự"
          />
          {errors.password?.message && (
            <p id="auth-password-error" className="mt-2 text-xs text-red-200/75">
              {errors.password.message}
            </p>
          )}
        </label>

        {serverMessage && (
          <p className="rounded-xl border border-red-300/15 bg-red-300/[0.06] px-4 py-3 text-sm leading-6 text-red-100/75">
            {serverMessage}
          </p>
        )}

        {successMessage && (
          <p className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-3 text-sm leading-6 text-emerald-100/75">
            {successMessage}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full bg-white text-black hover:bg-white/90"
        >
          {mode === "signin" ? (
            <LogIn className="size-4" aria-hidden="true" />
          ) : (
            <UserPlus className="size-4" aria-hidden="true" />
          )}
          {isSubmitting
            ? "Đang xử lý…"
            : mode === "signin"
              ? "Đăng nhập"
              : "Tạo tài khoản"}
        </Button>
      </form>

      <p className="mt-5 text-xs leading-5 text-white/32">
        Collection được lưu theo tài khoản Everie trên cloud và có thể truy cập lại khi đăng nhập trên thiết bị khác.
      </p>
    </div>
  );
}
