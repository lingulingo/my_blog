import type { Metadata } from "next";
import Link from "next/link";

import { HighlightText } from "@/components/highlight-text";
import { Pagination } from "@/components/pagination";
import { PopularPostsList } from "@/components/popular-posts-list";
import { prisma } from "@/lib/prisma";
import { getPopularPosts, type PopularPeriod } from "@/lib/queries";
import { absoluteUrl, siteName } from "@/lib/utils";

type PostsPageProps = {
  searchParams: Promise<{ q?: string; category?: string; page?: string; period?: PopularPeriod; sort?: "latest" | "hot" | "liked" }>;
};

export const metadata: Metadata = {
  title: "文章广场",
  description: "按分类浏览文章，并支持全文搜索标题、摘要和标签。",
  alternates: { canonical: "/posts" },
  openGraph: {
    title: `${siteName()} 文章广场`,
    description: "按分类浏览文章，并支持全文搜索标题、摘要和标签。",
    url: absoluteUrl("/posts"),
  },
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { q = "", category = "", page = "1", period = "all", sort = "latest" } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = 6;
  const activePeriod: PopularPeriod = ["7d", "30d", "all"].includes(period) ? period : "all";
  const activeSort = ["latest", "hot", "liked"].includes(sort) ? sort : "latest";
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const where = {
    published: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { excerpt: { contains: q } },
            { tags: { contains: q } },
          ],
        }
      : {}),
  };

  const [posts, totalPosts, popularPosts] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: true,
        category: true,
        _count: { select: { comments: true, reactions: true, visits: true } },
      },
      orderBy:
        activeSort === "latest"
          ? { createdAt: "desc" }
          : activeSort === "liked"
            ? [{ reactions: { _count: "desc" } }, { visits: { _count: "desc" } }, { createdAt: "desc" }]
            : [{ visits: { _count: "desc" } }, { reactions: { _count: "desc" } }, { createdAt: "desc" }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
    getPopularPosts(activePeriod),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">All posts</p>
        <h1 className="mt-2 text-4xl text-[var(--color-cream)]">内容广场</h1>
      </div>
      <form className="panel-surface grid gap-4 rounded-[1.75rem] p-5 lg:grid-cols-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索标题、摘要或标签"
          className="rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]"
          style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)", color: "var(--color-foreground)" }}
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]"
          style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)", color: "var(--color-foreground)" }}
        >
          <option value="">全部分类</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={activeSort}
          className="rounded-full px-5 py-3 outline-none focus:border-[var(--color-gold)]"
          style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)", color: "var(--color-foreground)" }}
        >
          <option value="latest">最新</option>
          <option value="hot">最热</option>
          <option value="liked">点赞最多</option>
        </select>
        <button type="submit" className="rounded-full bg-[var(--color-gold)] px-5 py-3 font-medium text-[var(--color-ink)]">
          搜索
        </button>
      </form>
      <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
        <span>当前排序：</span>
        <span className="rounded-full px-3 py-1 text-[var(--color-cream)]" style={{ background: "var(--color-panel-soft)", border: "1px solid var(--color-line)" }}>{activeSort === "latest" ? "最新" : activeSort === "hot" ? "最热" : "点赞最多"}</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {categories.map((item) => (
          <Link
            key={item.id}
            href={`/categories/${item.slug}`}
            className="rounded-full px-4 py-2 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-gold)]/40 hover:text-[var(--color-foreground)]"
            style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}
          >
            {item.name}
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          {q ? <p className="text-sm text-[var(--color-muted)]">搜索结果：<HighlightText text={q} query={q} /></p> : null}
          <div className="grid gap-6 lg:grid-cols-2">
            {posts.map((post) => (
              <article key={post.id} className="panel-surface rounded-[1.75rem] p-1">
                <div className="p-5">
                  <p className="text-sm text-[var(--color-muted)]">
                    {post.category?.name || "未分类"} · {post.author.name}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-[var(--color-cream)]">
                    <Link href={`/posts/${post.slug}`}>
                      <HighlightText text={post.title} query={q} />
                    </Link>
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    <HighlightText text={post.excerpt} query={q} />
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.split(",").map((tag) => (
                      <span key={tag} className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--color-gold)]" style={{ background: "var(--color-panel-soft)", border: "1px solid var(--color-line)" }}>
                        <HighlightText text={tag.trim()} query={q} />
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
         <PopularPostsList
            posts={popularPosts}
            period={activePeriod}
            makeHref={(nextPeriod) => {
              const params = new URLSearchParams();
              if (q) params.set("q", q);
              if (category) params.set("category", category);
              if (activeSort !== "latest") params.set("sort", activeSort);
              if (page) params.set("page", page);
              params.set("period", nextPeriod);
              return `/posts?${params.toString()}`;
            }}
          />
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        makeHref={(nextPage) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (category) params.set("category", category);
          if (activeSort !== "latest") params.set("sort", activeSort);
          if (activePeriod !== "all") params.set("period", activePeriod);
          params.set("page", String(nextPage));
          return `/posts?${params.toString()}`;
        }}
      />
      {posts.length === 0 ? <p className="text-sm text-[var(--color-muted)]">没有匹配到文章，换个关键词试试。</p> : null}
    </div>
  );
}
