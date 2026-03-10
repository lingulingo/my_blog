import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories] = await Promise.all([
    prisma.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  return [
    { url: absoluteUrl("/"), lastModified: new Date() },
    { url: absoluteUrl("/posts"), lastModified: new Date() },
    ...posts.map((post) => ({ url: absoluteUrl(`/posts/${post.slug}`), lastModified: post.updatedAt })),
    ...categories.map((category) => ({ url: absoluteUrl(`/categories/${category.slug}`), lastModified: category.updatedAt })),
  ];
}
