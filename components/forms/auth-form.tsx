"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    if (mode === "register") {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error || "注册失败");
        setLoading(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setError("邮箱或密码不正确");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="panel-surface space-y-4 rounded-[2rem] p-8 shadow-2xl shadow-black/10">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-[var(--color-gold)]">{mode === "login" ? "Linghan Valley" : "Join Linghan Valley"}</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--color-cream)]">{mode === "login" ? "回到灵寒谷" : "注册灵寒谷账号"}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{mode === "login" ? "登录后继续写作、管理文章与查看数据。" : "创建一个账号，开始记录你的文章、灵感与日常。"}</p>
      </div>
      {mode === "register" ? (
        <label className="block space-y-2">
          <span className="text-sm text-[var(--color-muted)]">昵称</span>
          <input name="name" required minLength={2} className="w-full rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
        </label>
      ) : null}
      <label className="block space-y-2">
        <span className="text-sm text-[var(--color-muted)]">邮箱</span>
        <input name="email" type="email" required className="w-full rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-[var(--color-muted)]">密码</span>
        <input name="password" type="password" required minLength={6} className="w-full rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
      </label>
      {mode === "login" ? (
        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-sm text-[var(--color-gold)] transition hover:opacity-80">
            忘记密码？
          </Link>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button type="submit" disabled={loading} className="w-full rounded-full bg-[var(--color-gold)] px-5 py-3 font-medium text-[var(--color-ink)] transition hover:opacity-90 disabled:opacity-70">
        {loading ? "处理中..." : mode === "login" ? "登录" : "注册并登录"}
      </button>
    </form>
  );
}
