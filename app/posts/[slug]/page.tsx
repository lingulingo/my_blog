import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Flame, PenSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { getServerAuthSession } from "@/auth";
import { CommentSection } from "@/components/comment-section";
import { PostVisitTracker } from "@/components/post-visit-tracker";
import { ReactionButton } from "@/components/reaction-button";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, formatDate, getHeatScore, resolveMediaUrl, siteName, tagList } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    include: { category: true, author: true },
  });

  if (!post) {
    return { title: "文章不存在" };
  }

  const coverImageUrl = resolveMediaUrl(post.coverImage);

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: absoluteUrl(`/posts/${post.slug}`),
      type: "article",
      siteName: siteName(),
      images: coverImageUrl ? [{ url: absoluteUrl(coverImageUrl) }] : undefined,
    },
    twitter: {
      card: coverImageUrl ? "summary_large_image" : "summary",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const session = await getServerAuthSession();
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: true,
      category: true,
      comments: { where: { status: "APPROVED" }, include: { author: true }, orderBy: { createdAt: "desc" }, take: 20 },
      reactions: true,
      _count: { select: { reactions: true, visits: true, comments: true } },
    },
  });

  if (!post || !post.published) {
    notFound();
  }

  const liked = session?.user?.id
    ? post.reactions.some((reaction) => reaction.userId === session.user.id)
    : false;
  const coverImageUrl = resolveMediaUrl(post.coverImage);

  return (
    <div className="space-y-8">
      <PostVisitTracker postId={post.id} path={`/posts/${post.slug}`} />
      <article className="panel-surface overflow-hidden rounded-[2rem]">
        <div
          className="h-80 w-full bg-cover bg-center"
          style={{
            backgroundImage: coverImageUrl
              ? `linear-gradient(180deg, rgba(7,10,17,0.2), rgba(7,10,17,0.88)), url(${coverImageUrl})`
              : "linear-gradient(135deg, rgba(212,177,106,0.22), rgba(46,74,109,0.7))",
          }}
        />
        <div className="space-y-6 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap gap-2">
            {post.category ? (
              <Link href={`/categories/${post.category.slug}`} className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--color-cream)]" style={{ background: "rgba(212,177,106,0.14)", border: "1px solid rgba(212,177,106,0.18)" }}>
                {post.category.name}
              </Link>
            ) : null}
            {tagList(post.tags).map((tag) => (
              <span key={tag} className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--color-gold)]" style={{ background: "var(--color-panel-soft)", border: "1px solid var(--color-line)" }}>{tag}</span>
            ))}
          </div>
          <div>
            <h1 className="max-w-4xl text-5xl leading-tight text-[var(--color-cream)]">{post.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">{post.excerpt}</p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm text-[var(--color-muted)]">
            <span>{post.author.name}</span>
            <span>{formatDate(post.createdAt)}</span>
            <span className="inline-flex items-center gap-2"><Eye size={16} />{post._count.visits}</span>
            <span className="inline-flex items-center gap-2"><Flame size={16} />{getHeatScore({ visits: post._count.visits, reactions: post._count.reactions, comments: post._count.comments })}</span>
            <span className="inline-flex items-center gap-2"><PenSquare size={16} />{post.contentFormat === "MARKDOWN" ? "Markdown 发布" : "富文本发布"}</span>
          </div>
          <ReactionButton postId={post.id} initialCount={post._count.reactions} initialLiked={liked} />
        </div>
      </article>

      <section className="panel-surface rounded-[2rem] p-6 sm:p-8">
        {post.contentFormat === "MARKDOWN" ? (
          <div className="article-prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="article-prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        )}
      </section>

      <CommentSection
        postId={post.id}
        comments={post.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          author: { name: comment.author.name, avatar: comment.author.avatar },
        }))}
      />
    </div>
  );
}
