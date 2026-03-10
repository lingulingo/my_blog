"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full px-4 py-2 text-sm transition hover:bg-[var(--button-ghost)]"
      style={{ border: "1px solid var(--color-line)", color: "var(--color-foreground)" }}
    >
      退出
    </button>
  );
}
