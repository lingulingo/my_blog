"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
};

type CategoryManagerProps = {
  categories: Category[];
};

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setSaving(true);
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description") || null,
      }),
    });
    setSaving(false);

    if (response.ok) {
      event.currentTarget.reset();
      setEditingId(null);
      router.refresh();
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("删除分类后，相关文章会变成未分类，确定继续吗？")) {
      return;
    }

    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (response.ok) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="panel-soft grid gap-4 rounded-[1.75rem] p-5 lg:grid-cols-2">
        <input name="name" required placeholder="分类名称" className="rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
        <input name="slug" required placeholder="category-slug" className="rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
        <textarea name="description" placeholder="分类描述" className="min-h-28 rounded-[1.25rem] px-5 py-4 outline-none focus:border-[var(--color-gold)] lg:col-span-2" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
        <div className="flex gap-3 lg:col-span-2">
          <button type="submit" disabled={saving} className="rounded-full bg-[var(--color-gold)] px-5 py-3 text-sm font-medium text-[var(--color-ink)] disabled:opacity-70">
            {saving ? "保存中..." : editingId ? "更新分类" : "新增分类"}
          </button>
          {editingId ? (
            <button type="button" onClick={() => setEditingId(null)} className="rounded-full px-5 py-3 text-sm" style={{ border: "1px solid var(--color-line)", color: "var(--color-foreground)" }}>
              取消编辑
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-4">
        {categories.map((category) => (
          <article key={category.id} className="flex flex-col gap-4 rounded-[1.5rem] p-5 md:flex-row md:items-center md:justify-between" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl text-[var(--color-cream)]">{category.name}</h3>
                <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--color-gold)]">{category.slug}</span>
                <span className="text-xs text-[var(--color-muted)]">{category.postCount} 篇文章</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--color-foreground)]/85">{category.description || "暂无描述"}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingId(category.id);
                  const form = document.querySelector("form") as HTMLFormElement | null;
                  if (!form) return;
                  (form.elements.namedItem("name") as HTMLInputElement).value = category.name;
                  (form.elements.namedItem("slug") as HTMLInputElement).value = category.slug;
                  (form.elements.namedItem("description") as HTMLTextAreaElement).value = category.description || "";
                }}
                className="rounded-full px-4 py-2 text-sm"
                style={{ border: "1px solid var(--color-line)", color: "var(--color-foreground)" }}
              >
                编辑
              </button>
              <button type="button" onClick={() => remove(category.id)} className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200">
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
