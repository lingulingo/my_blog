"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PostDeleteButtonProps = {
  postId: string;
};

export function PostDeleteButton({ postId }: PostDeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const remove = async () => {
    if (!window.confirm("删除后不可恢复，确定继续吗？")) {
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    setLoading(false);

    if (response.ok) {
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={remove}
      disabled={loading}
      className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:border-rose-400/50 hover:bg-rose-400/10 disabled:opacity-60"
    >
      {loading ? "删除中..." : "删除"}
    </button>
  );
}
