import Image from "next/image";
import Link from "next/link";
import { Flame, Heart, Eye } from "lucide-react";

import { HighlightText } from "@/components/highlight-text";
import { formatDate, getHeatScore, resolveMediaUrl, tagList } from "@/lib/utils";

type PostCardProps = {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage: string | null;
    tags: string;
    createdAt: Date;
    author: { name: string; avatar: string | null };
    category?: { name: string; slug: string } | null;
    _count: { comments: number; reactions: number; visits: number };
  };
  serialNumber?: number;
  highlightQuery?: string;
};

export function PostCard({ post, serialNumber, highlightQuery = "" }: PostCardProps) {
  const coverImageUrl = resolveMediaUrl(post.coverImage);

  return (
    <article className="panel-surface group overflow-hidden rounded-[1.75rem] transition duration-300 hover:shadow-xl hover:shadow-black/10" style={{ borderColor: "var(--color-line)" }}>
      <div className="relative h-52 w-full overflow-hidden" style={{ background: "var(--color-panel-soft)" }}>
        {coverImageUrl ? (
          <>
            <Image
              src={coverImageUrl}
              alt={post.title}
              fill
              quality={92}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(212,177,106,0.2), rgba(46,74,109,0.7))",
            }}
          />
        )}
        {typeof serialNumber === "number" ? (
          <div className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.22em] text-[var(--color-cream)]" style={{ background: "rgba(11,14,22,0.72)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
            {String(serialNumber).padStart(2, "0")}
          </div>
        ) : null}
      </div>
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          {tagList(post.tags).map((tag) => (
            <span key={tag} className="rounded-full bg-white/6 px-3 py-1 text-xs tracking-[0.2em] text-[var(--color-gold)] uppercase">
              <HighlightText text={tag} query={highlightQuery} />
            </span>
          ))}
        </div>
        <div>
          <p className="text-sm text-[var(--color-muted)]">
            {post.category ? `${post.category.name} · ` : ""}
            {post.author.name} · {formatDate(post.createdAt)}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)] transition group-hover:text-[var(--color-gold)]">
            <Link href={`/posts/${post.slug}`}>
              <HighlightText text={post.title} query={highlightQuery} />
            </Link>
          </h3>
        </div>
        <p className="line-clamp-3 text-sm leading-7 text-[var(--color-muted)]">
          <HighlightText text={post.excerpt} query={highlightQuery} />
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[rgba(212,177,106,0.12)] px-3 py-1 text-xs font-medium text-[var(--color-cream)]">
            热度分 {getHeatScore({ visits: post._count.visits, reactions: post._count.reactions, comments: post._count.comments })}
          </span>
          <span className="rounded-full bg-white/6 px-3 py-1 text-xs text-[var(--color-muted)]">点赞 {post._count.reactions}</span>
          <span className="rounded-full bg-white/6 px-3 py-1 text-xs text-[var(--color-muted)]">浏览 {post._count.visits}</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-[var(--color-muted)]">
          <span className="inline-flex items-center gap-2"><Eye size={16} />{post._count.visits}</span>
          <span className="inline-flex items-center gap-2"><Heart size={16} />{post._count.reactions}</span>
          <span className="inline-flex items-center gap-2"><Flame size={16} />{getHeatScore({ visits: post._count.visits, reactions: post._count.reactions, comments: post._count.comments })}</span>
        </div>
      </div>
    </article>
  );
}
