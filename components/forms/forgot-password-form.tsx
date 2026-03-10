"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const body = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(body.error || "发送失败，请稍后再试");
      setLoading(false);
      return;
    }

    setSuccess("如果该邮箱已注册，我们已经向它发送了重置密码邮件。");
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="panel-surface space-y-4 rounded-[2rem] p-8 shadow-2xl shadow-black/10">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-[var(--color-gold)]">Reset Password</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--color-cream)]">找回你的密码</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">输入你绑定的邮箱，我们会发送一封重置密码邮件到该地址。</p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-[var(--color-muted)]">邮箱</span>
        <input name="email" type="email" required className="w-full rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
      </label>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

      <button type="submit" disabled={loading} className="w-full rounded-full bg-[var(--color-gold)] px-5 py-3 font-medium text-[var(--color-ink)] transition hover:opacity-90 disabled:opacity-70">
        {loading ? "发送中..." : "发送重置邮件"}
      </button>

      <div className="text-center text-sm text-[var(--color-muted)]">
        <Link href="/auth/login" className="text-[var(--color-gold)] transition hover:opacity-80">
          返回登录
        </Link>
      </div>
    </form>
  );
}
