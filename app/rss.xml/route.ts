import { prisma } from "@/lib/prisma";
import { absoluteUrl, formatDate, siteName } from "@/lib/utils";

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: { author: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${siteName()}</title>
    <link>${absoluteUrl()}</link>
    <description>${siteName()} latest posts</description>
    ${posts
      .map(
        (post) => `<item>
      <title><![CDATA[${post.title}]]></title>
      <link>${absoluteUrl(`/posts/${post.slug}`)}</link>
      <guid>${absoluteUrl(`/posts/${post.slug}`)}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <author>${post.author.email}</author>
      ${post.category ? `<category>${post.category.name}</category>` : ""}
    </item>`,
      )
      .join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      "X-Generated-At": formatDate(new Date()),
    },
  });
}
