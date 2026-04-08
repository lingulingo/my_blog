import type { Metadata } from "next";
import { Cormorant_Garamond, Ma_Shan_Zheng, Manrope } from "next/font/google";

import { Providers } from "@/app/providers";
import { SiteHeader } from "@/components/site-header";
import { absoluteUrl, siteName } from "@/lib/utils";

import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const logo = Ma_Shan_Zheng({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl()),
  title: {
    default: `${siteName()} | 个人博客`,
    template: `%s | ${siteName()}`,
  },
  description: "灵寒谷的个人博客，包含文章发布、分类、搜索、RSS、上传与数据看板。",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: `${siteName()} RSS` }],
    },
  },
  openGraph: {
    title: `${siteName()} | 个人博客`,
    description: "灵寒谷的个人博客，包含文章发布、分类、搜索、RSS、上传与数据看板。",
    url: absoluteUrl(),
    siteName: siteName(),
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName()} | 个人博客`,
    description: "灵寒谷的个人博客，包含文章发布、分类、搜索、RSS、上传与数据看板。",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} ${logo.variable}`}>
        <Providers>
          <div className="relative min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] transition-colors duration-300">
            <div className="pointer-events-none fixed inset-0 bg-[var(--page-glow)] transition-all duration-300" />
            <SiteHeader />
            <main className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
            <footer className="relative mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
              <div
                className="rounded-[1.75rem] px-6 py-6 sm:px-7"
                style={{
                  border: "1px solid var(--color-line)",
                  background: "linear-gradient(180deg, var(--color-panel-soft), transparent)",
                }}
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-gold)]">Linghan Valley</p>
                    <p
                      className="mt-3 text-3xl text-[var(--color-foreground)]"
                      style={{ fontFamily: "var(--font-logo), var(--font-display), serif", letterSpacing: "0.08em" }}
                    >
                      灵寒谷
                    </p>
                  </div>
                  <p className="max-w-2xl text-sm leading-7 text-[var(--color-muted)] md:text-right">
                    灵寒谷用于展示个人原创文字作品与生活记录内容。
                  </p>
                </div>
                <div
                  className="mt-5 flex flex-col gap-2 pt-4 text-xs text-[var(--color-muted)] md:flex-row md:items-center md:justify-between"
                  style={{ borderTop: "1px solid var(--color-line)" }}
                >
                  <p>{new Date().getFullYear()} {siteName()} 版权所有</p>
                  <p>个人原创文字作品与生活记录</p>
                </div>
                <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--color-muted)]">
                  <a
                    href="https://beian.miit.gov.cn/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="transition hover:text-[var(--color-foreground)]"
                  >
                    沪ICP备2026011212号
                  </a>
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
