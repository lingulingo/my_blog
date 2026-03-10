import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Flame, Globe, Sparkles } from "lucide-react";

import { AnimatedHero } from "@/components/animated-hero";
import { PopularPostsList } from "@/components/popular-posts-list";
import { PostCard } from "@/components/post-card";
import { getHomeData, type PopularPeriod } from "@/lib/queries";
import { absoluteUrl, siteName } from "@/lib/utils";

export const metadata: Metadata = {
  title: "首页",
  description: "浏览热门文章、最新发布、内容分类和友情链接。",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${siteName()} 首页`,
    description: "浏览热门文章、最新发布、内容分类和友情链接。",
    url: absoluteUrl("/"),
  },
};

type HomeProps = {
  searchParams: Promise<{ period?: PopularPeriod }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { period = "all" } = await searchParams;
  const activePeriod: PopularPeriod = ["7d", "30d", "all"].includes(period) ? period : "all";
  const { featuredPosts, latestPosts, friendLinks, metrics, categories, popularPosts } = await getHomeData(activePeriod);

  return (
    <div className="space-y-12">
      <AnimatedHero />

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "已发布文章", value: metrics.postCount, icon: Sparkles },
          { label: "注册作者", value: metrics.userCount, icon: Globe },
          { label: "累计热度", value: popularPosts.reduce((sum, post) => sum + post.score, 0), icon: Flame },
          { label: "累计访问", value: metrics.visitCount, icon: ArrowRight },
        ].map((item) => (
          <div key={item.label} className="panel-surface rounded-[1.5rem] p-5">
            <item.icon className="text-[var(--color-gold)]" size={18} />
            <p className="mt-4 text-sm text-[var(--color-muted)]">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--color-cream)]">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`} className="rounded-full px-4 py-2 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-gold)]/40 hover:text-[var(--color-foreground)]" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}>
              {category.name} · {category._count.posts}
            </Link>
          ))}
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Popular picks</p>
            <h2 className="mt-2 text-4xl text-[var(--color-cream)]">热门内容</h2>
          </div>
          <Link href="/posts" className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]">
            查看全部文章
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {featuredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Latest stories</p>
            <h2 className="mt-2 text-4xl text-[var(--color-cream)]">最新发布</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {latestPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
        <aside className="space-y-5">
          <PopularPostsList posts={popularPosts} period={activePeriod} makeHref={(nextPeriod) => `/?period=${nextPeriod}`} />
          <div className="panel-surface space-y-5 rounded-[2rem] p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Friend links</p>
              <h2 className="mt-2 text-3xl text-[var(--color-cream)]">友情链接预留</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">已经预留独立数据表和前台展示区，后续可以直接扩展后台管理、审核、排序和站点图标上传。</p>
            </div>
            <div className="space-y-3">
              {friendLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="block rounded-[1.25rem] p-4 transition hover:border-[var(--color-gold)]/40 hover:bg-[var(--button-ghost)]" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}>
                  <p className="font-medium text-[var(--color-cream)]">{link.name}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{link.description}</p>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
