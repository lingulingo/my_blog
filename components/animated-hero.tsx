"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function AnimatedHero() {
  return (
    <section className="hero-surface relative overflow-hidden rounded-[2rem] px-6 py-16 shadow-2xl shadow-black/10 sm:px-10 lg:px-14" style={{ border: "1px solid var(--color-line)" }}>
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.06)_45%,transparent_100%)]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative max-w-3xl"
      >
        <p className="mb-4 text-sm uppercase tracking-[0.35em] text-[var(--color-gold)]">Linghan Valley Journal</p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-[var(--color-cream)] sm:text-6xl">
          在灵寒谷里，记录风、霜、思绪与每一篇值得留下的文字。
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
          这里适合写技术、写生活、写观察，也能用清晰的数据看见哪些内容真正被读到、被喜欢、被记住。
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/dashboard/editor/new"
            className="rounded-full bg-[var(--color-gold)] px-6 py-3 text-center font-medium text-[var(--color-ink)] transition hover:translate-y-[-1px]"
          >
            开始写第一篇
          </Link>
          <Link
            href="/posts"
            className="rounded-full border border-white/15 px-6 py-3 text-center text-[var(--color-cream)] transition hover:border-white/30 hover:bg-white/5"
          >
            浏览内容广场
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
