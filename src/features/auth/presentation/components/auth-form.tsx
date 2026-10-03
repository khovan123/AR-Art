"use client";

import { useEffect, useReducer } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoaderCircle,
  LogIn,
  Mail,
  RefreshCw,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/atoms/button";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import {
  buildAuthRedirectUrl,
  parseAuthCallbackHash,
  PENDING_SIGNUP_EMAIL_KEY,
  PENDING_SIGNUP_NEXT_PATH_KEY,
  sanitizeNextPath,
} from "@/features/auth/domain/auth-confirmation";
import {
  authFormSchema,
  type AuthFormValues,
} from "@/features/auth/domain/auth-form-schema";

interface AuthFormProps {
  nextPath?: string;
}

type ConfirmationRecoveryState = {
  status: "idle" | "expired" | "error" | "resending" | "resent";
  message: string | null;
};

function confirmationRecoveryReducer(
  _state: ConfirmationRecoveryState,
  nextState: ConfirmationRecoveryState,
): ConfirmationRecoveryState {
  return nextState;
}

function clearAuthHash() {
  if (!window.location.hash) return;

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
}

export function AuthForm({ nextPath }: AuthFormProps) {
  const router = useRouter();
  const redirectPath = sanitizeNextPath(nextPath);
  const [confirmationRecovery, dispatchConfirmationRecovery] = useReducer(
    confirmationRecoveryReducer,
    { status: "idle", message: null },
  );
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    getValues,
    trigger,
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
    const pendingEmail = window.localStorage.getItem(PENDING_SIGNUP_EMAIL_KEY);
    const callback = parseAuthCallbackHash(window.location.hash);
    let active = true;
    let redirected = false;

    if (pendingEmail) {
      setValue("email", pendingEmail, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }

    if (callback.kind === "expired") {
      dispatchConfirmationRecovery({
        status: "expired",
        message:
          "Link xác nhận email đã hết hạn hoặc không còn hợp lệ. Hãy gửi một link mới và chỉ sử dụng email xác nhận mới nhất.",
      });
      clearAuthHash();
    } else if (callback.kind === "error") {
      dispatchConfirmationRecovery({
        status: "error",
        message:
          "Không thể xác nhận email bằng link này. Bạn có thể gửi lại email xác nhận để nhận một link mới.",
      });
      clearAuthHash();
    }

    function finishAuthenticatedSession() {
      if (!active || redirected) return;
      redirected = true;
      window.localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
      window.localStorage.removeItem(PENDING_SIGNUP_NEXT_PATH_KEY);
      clearAuthHash();
      router.replace(redirectPath);
      router.refresh();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) finishAuthenticatedSession();
    });

    if (callback.kind !== "expired" && callback.kind !== "error") {
      void supabase.auth.getSession().then(({ data, error }) => {
        if (!active) return;

        if (data.session?.user) {
          finishAuthenticatedSession();
          return;
        }

        if (error && callback.kind === "success") {
          dispatchConfirmationRecovery({
            status: "error",
            message:
              "Email đã được mở nhưng phiên đăng nhập không thể được tạo. Hãy gửi lại email xác nhận và thử với link mới nhất.",
          });
          clearAuthHash();
        }
      });
    }

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [redirectPath, router, setValue]);

  function changeMode(nextMode: AuthFormValues["mode"]) {
    setValue("mode", nextMode, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    clearErrors();
  }

  async function resendConfirmation() {
    clearErrors("root");

    const emailIsValid = await trigger("email");
    if (!emailIsValid) return;

    const email = getValues("email").trim();
    dispatchConfirmationRecovery({
      status: "resending",
      message: "Đang gửi email xác nhận mới…",
    });

    try {
      const supabase = getSupabaseBrowserClient();
      const emailRedirectTo = buildAuthRedirectUrl(getAppUrl(), redirectPath);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo },
      });

      if (error) throw error;

      window.localStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, email);
      window.localStorage.setItem(PENDING_SIGNUP_NEXT_PATH_KEY, redirectPath);
      dispatchConfirmationRecovery({
        status: "resent",
        message:
          "Đã gửi email xác nhận mới. Hãy mở email mới nhất; các link xác nhận cũ có thể không còn hợp lệ.",
      });
    } catch (cause) {
      dispatchConfirmationRecovery({
        status: "error",
        message:
          cause instanceof Error
            ? cause.message
            : "Không thể gửi lại email xác nhận. Vui lòng thử lại.",
      });
    }
  }

  const submit = handleSubmit(async ({ email, password, mode: submitMode }) => {
    clearErrors("root");

    try {
      const supabase = getSupabaseBrowserClient();

      if (submitMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        window.localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
        window.localStorage.removeItem(PENDING_SIGNUP_NEXT_PATH_KEY);
        router.replace(redirectPath);
        router.refresh();
        return;
      }

      const emailRedirectTo = buildAuthRedirectUrl(getAppUrl(), redirectPath);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      });
      if (error) throw error;

      if (data.session) {
        window.localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
        window.localStorage.removeItem(PENDING_SIGNUP_NEXT_PATH_KEY);
        router.replace(redirectPath);
        router.refresh();
        return;
      }

      window.localStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, email);
      window.localStorage.setItem(PENDING_SIGNUP_NEXT_PATH_KEY, redirectPath);
      dispatchConfirmationRecovery({ status: "idle", message: null });
      setError("root.success", {
        type: "success",
        message:
          "Tài khoản đã được tạo. Hãy kiểm tra email và mở link xác nhận mới nhất để hoàn tất đăng ký.",
      });
    } catch (cause) {
      setError("root.server", {
        type: "server",
        message:
          cause instanceof Error ? cause.message : "Không thể xác thực tài khoản.",
      });
    }
  });

  const showRecovery = confirmationRecovery.status !== "idle";
  const recoverySucceeded = confirmationRecovery.status === "resent";
  const recoveryPending = confirmationRecovery.status === "resending";

  return (
    <div className="auth-card relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="auth-card-glow" aria-hidden="true" />

      <div className="auth-mode-switch relative flex rounded-full border border-white/10 bg-black/20 p-1">
        <span
          aria-hidden="true"
          className={`auth-mode-indicator ${mode === "signup" ? "is-signup" : ""}`}
        />
        <button
          type="button"
          onClick={() => changeMode("signin")}
          aria-pressed={mode === "signin"}
          className={`relative z-10 flex-1 rounded-full px-4 py-2 text-sm transition-colors duration-300 ${
            mode === "signin" ? "text-black" : "text-white/55 hover:text-white"
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => changeMode("signup")}
          aria-pressed={mode === "signup"}
          className={`relative z-10 flex-1 rounded-full px-4 py-2 text-sm transition-colors duration-300 ${
            mode === "signup" ? "text-black" : "text-white/55 hover:text-white"
          }`}
        >
          Tạo tài khoản
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <input type="hidden" {...register("mode")} />

        <label className="auth-field block">
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
            <p id="auth-email-error" className="auth-error mt-2 text-xs text-red-200/75">
              {errors.email.message}
            </p>
          )}
        </label>

        {showRecovery && (
          <div
            className={`auth-message rounded-xl border px-4 py-4 text-sm leading-6 ${
              recoverySucceeded
                ? "border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-100/80"
                : "border-amber-300/15 bg-amber-300/[0.06] text-amber-100/80"
            }`}
          >
            <div className="flex items-start gap-3">
              {recoverySucceeded ? (
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              ) : recoveryPending ? (
                <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {recoverySucceeded
                    ? "Email xác nhận mới đã được gửi"
                    : recoveryPending
                      ? "Đang gửi lại email"
                      : "Link xác nhận không còn hợp lệ"}
                </p>
                {confirmationRecovery.message && (
                  <p className="mt-1 text-xs leading-5 opacity-75">
                    {confirmationRecovery.message}
                  </p>
                )}
              </div>
            </div>

            {!recoverySucceeded && (
              <button
                type="button"
                disabled={recoveryPending}
                onClick={() => void resendConfirmation()}
                className="mt-3 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4 disabled:cursor-wait disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-3.5 ${recoveryPending ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                {recoveryPending ? "Đang gửi…" : "Gửi lại email xác nhận"}
              </button>
            )}
          </div>
        )}

        <label className="auth-field block">
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
            <p id="auth-password-error" className="auth-error mt-2 text-xs text-red-200/75">
              {errors.password.message}
            </p>
          )}
        </label>

        {serverMessage && (
          <p className="auth-message rounded-xl border border-red-300/15 bg-red-300/[0.06] px-4 py-3 text-sm leading-6 text-red-100/75">
            {serverMessage}
          </p>
        )}

        {successMessage && (
          <p className="auth-message rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-3 text-sm leading-6 text-emerald-100/75">
            {successMessage}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`auth-submit-button h-12 w-full bg-white text-black hover:bg-white/90 ${
            isSubmitting ? "is-loading" : ""
          }`}
        >
          {isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : mode === "signin" ? (
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

      <p className="auth-footnote mt-5 text-xs leading-5 text-white/32">
        Collection được lưu theo tài khoản Everie trên cloud và có thể truy cập lại khi đăng nhập trên thiết bị khác.
      </p>
    </div>
  );
}
