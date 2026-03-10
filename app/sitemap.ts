import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: new Date() },
    { url: absoluteUrl("/posts"), lastModified: new Date() },
  ];

  if (!process.env.DATABASE_URL) {
    return baseRoutes;
  }

  try {
    const [posts, categories] = await Promise.all([
      prisma.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    ]);

    return [
      ...baseRoutes,
      ...posts.map((post) => ({ url: absoluteUrl(`/posts/${post.slug}`), lastModified: post.updatedAt })),
      ...categories.map((category) => ({ url: absoluteUrl(`/categories/${category.slug}`), lastModified: category.updatedAt })),
    ];
  } catch (error) {
    console.error("生成 sitemap 时读取数据库失败，已降级为基础路由。", error);
    return baseRoutes;
  }
}
