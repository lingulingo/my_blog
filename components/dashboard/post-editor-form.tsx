"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";

import { RichTextEditor } from "@/components/editor/rich-text-editor";

type EditorFormProps = {
  post?: {
    id: string;
    title: string;
    excerpt: string;
    tags: string;
    categoryId: string | null;
    coverImage: string | null;
    content: string;
    contentFormat: "HTML" | "MARKDOWN";
    published: boolean;
  } | null;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

export function PostEditorForm({ post, categories }: EditorFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(post?.content || "<p>从这里开始写作。</p>");
  const [contentFormat, setContentFormat] = useState<"HTML" | "MARKDOWN">(post?.contentFormat || "HTML");
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const upload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "posts");

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    if (!response.ok) {
      throw new Error("上传失败");
    }

    const body = (await response.json()) as { url: string };
    return body.url;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: post?.id,
        title: formData.get("title"),
        excerpt: formData.get("excerpt"),
        tags: formData.get("tags"),
        categoryId: formData.get("categoryId") || null,
        published: formData.get("published") === "on",
        coverImage,
        content,
        contentFormat,
      }),
    });

    const body = (await response.json()) as { slug?: string; error?: string };

    if (!response.ok) {
      setMessage(body.error || "保存失败");
      setSubmitting(false);
      return;
    }

    setMessage("已保存");
    router.push(`/posts/${body.slug}`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="panel-surface space-y-4 rounded-[1.75rem] p-6">
          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-muted)]">标题</span>
            <input name="title" defaultValue={post?.title} required className="w-full rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-muted)]">摘要</span>
            <textarea name="excerpt" defaultValue={post?.excerpt} required minLength={20} className="min-h-28 w-full rounded-[1.25rem] px-5 py-4 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-muted)]">标签</span>
            <input name="tags" defaultValue={post?.tags} placeholder="设计, 技术, 生活" className="w-full rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-muted)]">分类</span>
            <select name="categoryId" defaultValue={post?.categoryId || ""} className="w-full rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }}>
              <option value="">未分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="panel-surface space-y-4 rounded-[1.75rem] p-6">
          <div className="space-y-3">
            <span className="text-sm text-[var(--color-muted)]">封面图</span>
            <label className="flex cursor-pointer items-center justify-center gap-3 rounded-[1.25rem] px-4 py-6 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-gold)]/50 hover:text-[var(--color-foreground)]" style={{ border: "1px dashed var(--color-line)", background: "var(--color-panel-soft)" }}>
              <ImagePlus size={18} />
              上传封面
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const url = await upload(file);
                  setCoverImage(url);
                }}
              />
            </label>
            {coverImage ? (
              <div className="overflow-hidden rounded-[1.25rem]" style={{ border: "1px solid var(--color-line)" }}>
                <Image src={coverImage} alt="cover" width={800} height={320} unoptimized className="h-44 w-full object-cover" />
              </div>
            ) : null}
          </div>
          <label className="flex items-center gap-3 rounded-full px-4 py-3 text-sm text-[var(--color-muted)]" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}>
            <input type="checkbox" name="published" defaultChecked={post?.published ?? true} className="h-4 w-4 accent-[var(--color-gold)]" />
            发布到前台
          </label>
          {message ? <p className="text-sm text-[var(--color-gold)]">{message}</p> : null}
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-[var(--color-gold)] px-5 py-3 font-medium text-[var(--color-ink)] transition hover:opacity-90 disabled:opacity-70">
            {submitting ? "保存中..." : "保存文章"}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-muted)]">正文</p>
          <div className="flex items-center gap-2 rounded-full panel-soft p-1 text-sm">
            <button
              type="button"
              onClick={() => setContentFormat("HTML")}
              className={`rounded-full px-4 py-2 transition ${contentFormat === "HTML" ? "bg-[var(--color-gold)] text-[var(--color-ink)]" : "text-[var(--color-muted)]"}`}
            >
              富文本
            </button>
            <button
              type="button"
              onClick={() => setContentFormat("MARKDOWN")}
              className={`rounded-full px-4 py-2 transition ${contentFormat === "MARKDOWN" ? "bg-[var(--color-gold)] text-[var(--color-ink)]" : "text-[var(--color-muted)]"}`}
            >
              Markdown
            </button>
          </div>
        </div>
        {contentFormat === "HTML" ? (
          <RichTextEditor name="content" value={content} onChange={setContent} />
        ) : (
          <div className="panel-surface rounded-[1.75rem] p-4">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="# 在这里写 Markdown\n\n支持标题、列表、代码块、表格、链接等常用格式。"
              className="min-h-[420px] w-full rounded-[1.25rem] px-5 py-4 font-mono text-sm outline-none"
              style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)", color: "var(--color-foreground)" }}
            />
          </div>
        )}
      </div>
    </form>
  );
}
