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
    <div className="mt-12 w-full">
      <div className="grid grid-cols-2 border-b border-white/12">
        <button
          type="button"
          onClick={() => changeMode("signin")}
          aria-pressed={mode === "signin"}
          className={`border-b-2 px-0 pb-4 text-left text-xs font-medium uppercase tracking-[0.14em] transition ${
            mode === "signin"
              ? "border-white text-white"
              : "border-transparent text-white/30 hover:text-white/70"
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => changeMode("signup")}
          aria-pressed={mode === "signup"}
          className={`border-b-2 px-0 pb-4 text-right text-xs font-medium uppercase tracking-[0.14em] transition ${
            mode === "signup"
              ? "border-white text-white"
              : "border-transparent text-white/30 hover:text-white/70"
          }`}
        >
          Tạo tài khoản
        </button>
      </div>

      <form className="mt-9 space-y-7" onSubmit={submit} noValidate>
        <input type="hidden" {...register("mode")} />

        <label className="block">
          <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-white/35">Email</span>
          <input
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "auth-email-error" : undefined}
            {...register("email")}
            className={`mt-3 h-12 w-full border-0 border-b bg-transparent px-0 text-base text-white outline-none transition placeholder:text-white/20 ${
              errors.email ? "border-rose-300/55" : "border-white/18 focus:border-cyan-200/70"
            }`}
            placeholder="you@example.com"
          />
          {errors.email?.message ? (
            <p id="auth-email-error" className="mt-2 text-xs text-rose-200/80">
              {errors.email.message}
            </p>
          ) : null}
        </label>

        {showRecovery ? (
          <div
            className={`border-l-2 py-1 pl-4 text-sm leading-6 ${
              recoverySucceeded
                ? "border-emerald-300/55 text-emerald-100/80"
                : "border-amber-300/55 text-amber-100/80"
            }`}
          >
            <div className="flex items-start gap-3">
              {recoverySucceeded ? (
                <Mail className="mt-1 size-4 shrink-0" aria-hidden="true" />
              ) : recoveryPending ? (
                <LoaderCircle className="mt-1 size-4 shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <TriangleAlert className="mt-1 size-4 shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {recoverySucceeded
                    ? "Email xác nhận mới đã được gửi"
                    : recoveryPending
                      ? "Đang gửi lại email"
                      : "Link xác nhận đã hết hạn"}
                </p>
                {confirmationRecovery.message ? (
                  <p className="mt-1 text-xs leading-5 opacity-75">{confirmationRecovery.message}</p>
                ) : null}
              </div>
            </div>
            {!recoverySucceeded ? (
              <button
                type="button"
                disabled={recoveryPending}
                onClick={() => void resendConfirmation()}
                className="mt-3 inline-flex items-center gap-2 border-b border-current pb-0.5 text-xs font-medium disabled:cursor-wait disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${recoveryPending ? "animate-spin" : ""}`} aria-hidden="true" />
                {recoveryPending ? "Đang gửi…" : "Gửi link mới"}
              </button>
            ) : null}
          </div>
        ) : null}

        <label className="block">
          <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-white/35">Mật khẩu</span>
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "auth-password-error" : undefined}
            {...register("password")}
            className={`mt-3 h-12 w-full border-0 border-b bg-transparent px-0 text-base text-white outline-none transition placeholder:text-white/20 ${
              errors.password ? "border-rose-300/55" : "border-white/18 focus:border-cyan-200/70"
            }`}
            placeholder="Tối thiểu 6 ký tự"
          />
          {errors.password?.message ? (
            <p id="auth-password-error" className="mt-2 text-xs text-rose-200/80">{errors.password.message}</p>
          ) : null}
        </label>

        {serverMessage ? (
          <p className="border-l-2 border-rose-300/55 py-1 pl-4 text-sm leading-6 text-rose-100/80">{serverMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="border-l-2 border-emerald-300/55 py-1 pl-4 text-sm leading-6 text-emerald-100/80">{successMessage}</p>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-13 w-full rounded-none bg-white text-black hover:bg-violet-100"
        >
          {isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : mode === "signin" ? (
            <LogIn className="size-4" aria-hidden="true" />
          ) : (
            <UserPlus className="size-4" aria-hidden="true" />
          )}
          {isSubmitting ? "Đang xử lý…" : mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
        </Button>
      </form>

      <p className="mt-6 text-xs leading-5 text-white/30">Bộ sưu tập đi theo tài khoản của bạn trên mọi thiết bị.</p>
    </div>
  );
}
