import Image from "next/image";
import Link from "next/link";
import { Eye, Flame, Heart } from "lucide-react";

import { HighlightText } from "@/components/highlight-text";
import { cn, formatDate, getHeatScore, resolveMediaUrl, tagList } from "@/lib/utils";

type PostCardVariant = "default" | "lead" | "compact" | "horizontal";

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
  variant?: PostCardVariant;
  maxTags?: number;
  excerptLines?: 2 | 3;
};

function coverHeightClass(variant: PostCardVariant) {
  if (variant === "lead") {
    return "h-48 md:h-56";
  }
  if (variant === "compact") {
    return "h-36 md:h-40";
  }
  if (variant === "horizontal") {
    return "h-40 w-full sm:h-32 sm:w-[10.5rem] md:w-44 sm:shrink-0";
  }
  return "h-40 md:h-44";
}

export function PostCard({
  post,
  serialNumber,
  highlightQuery = "",
  variant = "default",
  maxTags,
  excerptLines = 3,
}: PostCardProps) {
  const coverImageUrl = resolveMediaUrl(post.coverImage);
  const tags = tagList(post.tags);
  const shownTags = maxTags != null ? tags.slice(0, maxTags) : tags;
  const heat = getHeatScore({
    visits: post._count.visits,
    reactions: post._count.reactions,
    comments: post._count.comments,
  });

  const coverBlock = (
    <div
      className={cn(
        "relative overflow-hidden",
        coverHeightClass(variant),
        variant === "horizontal" ? "sm:rounded-l-[1.75rem] sm:rounded-r-none rounded-t-[1.75rem]" : "w-full",
      )}
      style={{ background: "var(--color-panel-soft)" }}
    >
      {coverImageUrl ? (
        <>
          <Image
            src={coverImageUrl}
            alt={post.title}
            fill
            quality={88}
            sizes={
              variant === "horizontal"
                ? "(max-width: 640px) 100vw, 11rem"
                : variant === "lead"
                  ? "(max-width: 768px) 100vw, 100vw"
                  : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            }
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
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
        <div
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.2em] sm:left-4 sm:top-4 sm:px-3 sm:text-xs sm:tracking-[0.22em]"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.24)",
            color: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          {String(serialNumber).padStart(2, "0")}
        </div>
      ) : null}
    </div>
  );

  const metaLine = (
    <p className="text-xs text-[var(--color-muted)] sm:text-sm">
      {post.category ? `${post.category.name} · ` : ""}
      {post.author.name} · {formatDate(post.createdAt)}
    </p>
  );

  const titleClass =
    variant === "horizontal"
      ? "mt-2 text-lg font-semibold leading-snug text-[var(--color-foreground)] transition group-hover:text-[var(--color-gold)] sm:text-xl"
      : variant === "compact"
        ? "mt-2 text-xl font-semibold leading-snug text-[var(--color-foreground)] transition group-hover:text-[var(--color-gold)]"
        : "mt-2 text-xl font-semibold leading-snug text-[var(--color-foreground)] transition group-hover:text-[var(--color-gold)] md:mt-3 md:text-2xl";

  const statsRow = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--color-muted)] sm:text-sm">
      <span className="inline-flex items-center gap-1.5">
        <Eye size={15} className="shrink-0 opacity-80" />
        {post._count.visits}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Heart size={15} className="shrink-0 opacity-80" />
        {post._count.reactions}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Flame size={15} className="shrink-0 text-[var(--color-gold)]/90" />
        {heat}
      </span>
    </div>
  );

  const tagsRow =
    shownTags.length > 0 ? (
      <div className="flex flex-wrap gap-1.5">
        {shownTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-white/6 px-2.5 py-0.5 text-[10px] tracking-[0.18em] text-[var(--color-gold)] uppercase sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.2em]"
          >
            <HighlightText text={tag} query={highlightQuery} />
          </span>
        ))}
      </div>
    ) : null;

  const excerptClass = cn(
    "text-sm leading-7 text-[var(--color-muted)]",
    excerptLines === 2 ? "line-clamp-2" : "line-clamp-3",
  );

  if (variant === "horizontal") {
    return (
      <article
        className="panel-surface group flex flex-col overflow-hidden rounded-[1.75rem] transition duration-300 hover:shadow-lg hover:shadow-black/8 sm:flex-row"
        style={{ borderColor: "var(--color-line)" }}
      >
        {coverBlock}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-5 sm:py-5 sm:pl-5 sm:pr-6">
          {tagsRow}
          <div>
            {metaLine}
            <h3 className={titleClass}>
              <Link href={`/posts/${post.slug}`} className="block">
                <HighlightText text={post.title} query={highlightQuery} />
              </Link>
            </h3>
          </div>
          <p className={excerptClass}>
            <HighlightText text={post.excerpt} query={highlightQuery} />
          </p>
          {statsRow}
        </div>
      </article>
    );
  }

  return (
    <article
      className="panel-surface group overflow-hidden rounded-[1.75rem] transition duration-300 hover:shadow-lg hover:shadow-black/8"
      style={{ borderColor: "var(--color-line)" }}
    >
      {coverBlock}
      <div className={cn("space-y-3 p-5 md:space-y-4 md:p-6", variant === "compact" && "space-y-2.5 p-5")}>
        {tagsRow}
        <div>
          {metaLine}
          <h3 className={titleClass}>
            <Link href={`/posts/${post.slug}`}>
              <HighlightText text={post.title} query={highlightQuery} />
            </Link>
          </h3>
        </div>
        <p className={excerptClass}>
          <HighlightText text={post.excerpt} query={highlightQuery} />
        </p>
        {statsRow}
      </div>
    </article>
  );
}
