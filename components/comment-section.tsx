"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { formatDate } from "@/lib/utils";

type CommentSectionProps = {
  postId: string;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string | Date;
    author: { name: string; avatar: string | null };
  }>;
};

export function CommentSection({ postId, comments }: CommentSectionProps) {
  const router = useRouter();
  const { status } = useSession();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status !== "authenticated") {
      router.push("/auth/login");
      return;
    }

    setSubmitting(true);
    setMessage("");
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content }),
    });
    const body = (await response.json()) as { message?: string };

    if (response.ok) {
      setContent("");
      setMessage(body.message || "评论已发布");
      router.refresh();
    }

    setSubmitting(false);
  };

  return (
    <section className="panel-surface rounded-[1.75rem] p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-[var(--color-cream)]">留言互动</h2>
        <span className="text-sm text-[var(--color-muted)]">共 {comments.length} 条</span>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="写下你的想法..."
          required
          minLength={2}
          className="min-h-32 w-full rounded-[1.5rem] px-5 py-4 text-sm outline-none transition focus:border-[var(--color-gold)]"
          style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)", color: "var(--color-foreground)" }}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[var(--color-gold)] px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:opacity-90 disabled:opacity-70"
        >
          {submitting ? "发布中..." : "发布留言"}
        </button>
        {message ? <p className="text-sm text-[var(--color-gold)]">{message}</p> : null}
      </form>
      <div className="mt-8 space-y-4">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-[1.5rem] p-4" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-[var(--color-cream)]">{comment.author.name}</p>
              <time className="text-xs text-[var(--color-muted)]">{formatDate(comment.createdAt)}</time>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--color-muted)]">{comment.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
