"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FriendLink = {
  id: string;
  name: string;
  url: string;
  description: string;
  avatar: string | null;
  sortOrder: number;
  isActive: boolean;
};

type FriendLinkManagerProps = {
  links: FriendLink[];
};

export function FriendLinkManager({ links }: FriendLinkManagerProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    const response = await fetch("/api/friend-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        url: formData.get("url"),
        description: formData.get("description"),
        avatar: formData.get("avatar") || null,
        sortOrder: Number(formData.get("sortOrder") || 0),
      }),
    });
    setSaving(false);

    if (response.ok) {
      event.currentTarget.reset();
      router.refresh();
    }
  };

  const toggle = async (link: FriendLink) => {
    await fetch(`/api/friend-links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !link.isActive }),
    });
    router.refresh();
  };

  const remove = async (id: string) => {
    await fetch(`/api/friend-links/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="panel-soft grid gap-4 rounded-[1.75rem] p-5 lg:grid-cols-2">
        <input name="name" required placeholder="站点名称" className="rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
        <input name="url" required placeholder="https://example.com" className="rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
        <input name="avatar" placeholder="图标 URL（可选）" className="rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
        <input name="sortOrder" type="number" defaultValue={0} className="rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
        <textarea name="description" required placeholder="一句话介绍" className="min-h-28 rounded-[1.25rem] px-5 py-4 outline-none focus:border-[var(--color-gold)] lg:col-span-2" style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)", color: "var(--color-foreground)" }} />
        <button type="submit" disabled={saving} className="w-fit rounded-full bg-[var(--color-gold)] px-5 py-3 text-sm font-medium text-[var(--color-ink)] disabled:opacity-70 lg:col-span-2">
          {saving ? "保存中..." : "新增友情链接"}
        </button>
      </form>

      <div className="space-y-4">
        {links.map((link) => (
          <article key={link.id} className="flex flex-col gap-4 rounded-[1.5rem] p-5 md:flex-row md:items-center md:justify-between" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl text-[var(--color-cream)]">{link.name}</h3>
                <span className={`rounded-full px-3 py-1 text-xs ${link.isActive ? "bg-emerald-400/15 text-emerald-200" : "bg-white/8 text-[var(--color-muted)]"}`}>
                  {link.isActive ? "展示中" : "已隐藏"}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{link.url}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-foreground)]/85">{link.description}</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => toggle(link)} className="rounded-full px-4 py-2 text-sm" style={{ border: "1px solid var(--color-line)", color: "var(--color-foreground)" }}>
                {link.isActive ? "隐藏" : "启用"}
              </button>
              <button type="button" onClick={() => remove(link.id)} className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200">
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
