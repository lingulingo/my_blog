import { prisma } from "@/lib/prisma";

export type PopularPeriod = "all" | "7d" | "30d";

function periodStart(period: PopularPeriod) {
  if (period === "all") {
    return undefined;
  }

  const date = new Date();
  date.setDate(date.getDate() - (period === "7d" ? 7 : 30));
  return date;
}

export async function getPopularPosts(period: PopularPeriod) {
  const since = periodStart(period);
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: {
      visits: since ? { where: { createdAt: { gte: since } }, select: { id: true } } : { select: { id: true } },
      reactions: since ? { where: { createdAt: { gte: since } }, select: { id: true } } : { select: { id: true } },
      comments: since ? { where: { createdAt: { gte: since }, status: "APPROVED" }, select: { id: true } } : { where: { status: "APPROVED" }, select: { id: true } },
    },
  });

  return posts
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      createdAt: post.createdAt,
      score: post.visits.length * 3 + post.reactions.length * 2 + post.comments.length,
      _count: {
        visits: post.visits.length,
        reactions: post.reactions.length,
        comments: post.comments.length,
      },
    }))
    .sort((a, b) => b.score - a.score || b._count.visits - a._count.visits)
    .slice(0, 5);
}

export async function getSiteMetrics() {
  const [postCount, commentCount, userCount, visitCount] = await Promise.all([
    prisma.post.count({ where: { published: true } }),
    prisma.comment.count(),
    prisma.user.count(),
    prisma.visit.count(),
  ]);

  return { postCount, commentCount, userCount, visitCount };
}

export async function getHomeData(period: PopularPeriod = "all") {
  const [featuredPosts, latestPosts, friendLinks, metrics, categories, popularPosts] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      include: {
        author: true,
        category: true,
        _count: { select: { comments: true, reactions: true, visits: true } },
      },
      orderBy: { visits: { _count: "desc" } },
      take: 3,
    }),
    prisma.post.findMany({
      where: { published: true },
      include: {
        author: true,
        category: true,
        _count: { select: { comments: true, reactions: true, visits: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.friendLink.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getSiteMetrics(),
    prisma.category.findMany({
      include: { _count: { select: { posts: { where: { published: true } } } } },
      orderBy: { name: "asc" },
    }),
    getPopularPosts(period),
  ]);

  return { featuredPosts, latestPosts, friendLinks, metrics, categories, popularPosts };
}
