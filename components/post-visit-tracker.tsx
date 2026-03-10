"use client";

import { useEffect } from "react";

type PostVisitTrackerProps = {
  postId: string;
  path: string;
};

export function PostVisitTracker({ postId, path }: PostVisitTrackerProps) {
  useEffect(() => {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, path }),
    });
  }, [path, postId]);

  return null;
}
