"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/atoms/button";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";

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
  const redirectPath = useMemo(() => sanitizeNextPath(nextPath), [nextPath]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState<"idle" | "working">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(redirectPath);
    });
  }, [redirectPath, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "working") return;

    setStatus("working");
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "signin") {
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
      } else {
        setMessage("Tài khoản đã được tạo. Hãy kiểm tra email để xác nhận, sau đó quay lại đăng nhập.");
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Không thể xác thực tài khoản.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="flex rounded-full border border-white/10 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setMessage(null);
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
            mode === "signin" ? "bg-white text-black" : "text-white/55 hover:text-white"
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setMessage(null);
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
            mode === "signup" ? "bg-white text-black" : "text-white/55 hover:text-white"
          }`}
        >
          Tạo tài khoản
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit}>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/35">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/30"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/35">Mật khẩu</span>
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/30"
            placeholder="Tối thiểu 6 ký tự"
          />
        </label>

        {message && (
          <p className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-white/65">
            {message}
          </p>
        )}

        <Button
          type="submit"
          disabled={status === "working"}
          className="h-12 w-full bg-white text-black hover:bg-white/90"
        >
          {mode === "signin" ? (
            <LogIn className="size-4" aria-hidden="true" />
          ) : (
            <UserPlus className="size-4" aria-hidden="true" />
          )}
          {status === "working"
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
