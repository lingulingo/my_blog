import Link from "next/link";

import { getServerAuthSession } from "@/auth";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteName } from "@/lib/utils";

export async function SiteHeader() {
  const session = await getServerAuthSession();

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-xl" style={{ borderColor: "var(--header-border)", background: "var(--header-bg)" }}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-3xl text-[var(--color-cream)] transition hover:opacity-90 sm:text-4xl"
          style={{ fontFamily: "var(--font-logo), var(--font-display), serif", letterSpacing: "0.08em" }}
        >
          {siteName()}
        </Link>
        <nav className="flex items-center gap-3 text-sm text-[var(--color-muted)] sm:gap-5">
          <ThemeToggle />
          <Link href="/posts" className="transition hover:text-[var(--color-foreground)]">
            文章
          </Link>
          <Link href="/rss.xml" className="transition hover:text-[var(--color-foreground)]">
            RSS
          </Link>
          <Link href="/dashboard" className="transition hover:text-[var(--color-foreground)]">
            控制台
          </Link>
          {session?.user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-[var(--color-foreground)]/80 sm:inline">{session.user.name}</span>
              <LogoutButton />
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="transition hover:text-[var(--color-foreground)]">
                登录
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-[var(--color-gold)] px-4 py-2 font-medium text-[var(--color-ink)] transition hover:opacity-90"
              >
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
