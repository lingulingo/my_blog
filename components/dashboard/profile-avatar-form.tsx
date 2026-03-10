"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { resolveMediaUrl } from "@/lib/utils";

type ProfileAvatarFormProps = {
  currentAvatar: string | null;
};

export function ProfileAvatarForm({ currentAvatar }: ProfileAvatarFormProps) {
  const router = useRouter();
  const [avatar, setAvatar] = useState(currentAvatar || "");
  const [saving, setSaving] = useState(false);
  const avatarSrc = resolveMediaUrl(avatar);

  const upload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "avatars");

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const body = (await response.json()) as { url: string };
    setAvatar(body.url);
    return body.url;
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar }),
    });
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="panel-surface space-y-4 rounded-[1.75rem] p-6">
      <div className="flex items-center gap-4">
        {avatar ? (
          <Image src={avatarSrc} alt="avatar" width={80} height={80} unoptimized className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(212,177,106,0.18)] text-2xl font-semibold text-[var(--color-cream)]">
            A
          </div>
        )}
        <label
          className="rounded-full px-4 py-2 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-gold)] hover:text-[var(--color-foreground)]"
          style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}
        >
          上传头像
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) {
                await upload(file);
              }
            }}
          />
        </label>
      </div>
      <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]">
        {saving ? "保存中..." : "保存头像"}
      </button>
    </div>
  );
}
