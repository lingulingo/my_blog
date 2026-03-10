"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type ReactionButtonProps = {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
};

export function ReactionButton({ postId, initialCount, initialLiked }: ReactionButtonProps) {
  const router = useRouter();
  const { status } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [submitting, setSubmitting] = useState(false);

  const toggle = async () => {
    if (status !== "authenticated") {
      router.push("/auth/login");
      return;
    }

    setSubmitting(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((current) => current + (nextLiked ? 1 : -1));

    const response = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });

    if (!response.ok) {
      setLiked(!nextLiked);
      setCount((current) => current + (nextLiked ? -1 : 1));
    } else {
      router.refresh();
    }

    setSubmitting(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={submitting}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
        liked
          ? "border-[var(--color-gold)] bg-[rgba(212,177,106,0.16)] text-[var(--color-cream)]"
          : "border-white/10 text-[var(--color-muted)] hover:border-white/25 hover:text-white"
      }`}
    >
      <Heart size={16} className={liked ? "fill-current" : ""} />
      点赞 {count}
    </button>
  );
}
