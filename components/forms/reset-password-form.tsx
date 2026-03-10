"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!token) {
      setError("重置链接缺少 token");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("密码至少需要 6 位");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const body = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(body.error || "重置失败，请重新申请邮件");
      setLoading(false);
      return;
    }

    setSuccess("密码已重置，正在跳转到登录页。");
    setLoading(false);
    setTimeout(() => {
      router.push("/auth/login");
    }, 1200);
  };

  return (
    <form onSubmit={submit} className="panel-surface space-y-4 rounded-[2rem] p-8 shadow-2xl shadow-black/10">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-[var(--color-gold)]">Set New Password</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--color-cream)]">设置新密码</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">输入一个新的密码，保存后你可以直接用它重新登录。</p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-[var(--color-muted)]">新密码</span>
        <input name="password" type="password" required minLength={6} className="w-full rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[var(--color-muted)]">确认新密码</span>
        <input name="confirmPassword" type="password" required minLength={6} className="w-full rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
      </label>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

      <button type="submit" disabled={loading || !token} className="w-full rounded-full bg-[var(--color-gold)] px-5 py-3 font-medium text-[var(--color-ink)] transition hover:opacity-90 disabled:opacity-70">
        {loading ? "保存中..." : "保存新密码"}
      </button>

      {!token ? <p className="text-sm text-rose-300">当前链接无效，请重新申请重置密码邮件。</p> : null}

      <div className="text-center text-sm text-[var(--color-muted)]">
        <Link href="/auth/login" className="text-[var(--color-gold)] transition hover:opacity-80">
          返回登录
        </Link>
      </div>
    </form>
  );
}
