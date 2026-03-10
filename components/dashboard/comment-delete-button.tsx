"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommentDeleteButton({ commentId }: { commentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        if (!window.confirm("确定删除这条留言吗？")) return;
        setLoading(true);
        const response = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
        setLoading(false);
        if (response.ok) router.refresh();
      }}
      className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 disabled:opacity-60"
    >
      {loading ? "删除中..." : "删除留言"}
    </button>
  );
}
