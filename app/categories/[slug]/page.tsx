import type { Metadata } from "next";

import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/post-card";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, siteName } from "@/lib/utils";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });

  if (!category) {
    return { title: "分类不存在" };
  }

  return {
    title: `${category.name} 分类`,
    description: category.description || `浏览 ${category.name} 相关文章。`,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: {
      title: `${siteName()} · ${category.name}`,
      description: category.description || `浏览 ${category.name} 相关文章。`,
      url: absoluteUrl(`/categories/${category.slug}`),
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = 6;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { posts: { where: { published: true } } } },
    },
  });

  if (!category) {
    return <div className="panel-surface rounded-[2rem] p-8 text-[var(--color-muted)]">分类不存在。</div>;
  }

  const posts = await prisma.post.findMany({
    where: { published: true, categoryId: category.id },
    include: {
      author: true,
      category: true,
      _count: { select: { comments: true, reactions: true, visits: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });
  const totalPages = Math.max(1, Math.ceil(category._count.posts / pageSize));

  return (
    <div className="space-y-6">
      <div className="panel-surface rounded-[2rem] p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Category</p>
        <h1 className="mt-2 text-4xl text-[var(--color-cream)]">{category.name}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">{category.description || "这个分类下的文章会聚合展示在这里。"}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {posts.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            serialNumber={(currentPage - 1) * pageSize + index + 1}
          />
        ))}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} makeHref={(nextPage) => `/categories/${category.slug}?page=${nextPage}`} />
      {posts.length === 0 ? <p className="text-sm text-[var(--color-muted)]">这个分类还没有文章。</p> : null}
    </div>
  );
}
