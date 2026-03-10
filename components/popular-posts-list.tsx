import Link from "next/link";

import { formatDate } from "@/lib/utils";

type PopularPostsListProps = {
  posts: Array<{
    id: string;
    title: string;
    slug: string;
    createdAt: Date;
    _count: { visits: number; reactions: number; comments: number };
  }>;
  period: "all" | "7d" | "30d";
  makeHref: (period: "all" | "7d" | "30d") => string;
};

export function PopularPostsList({ posts, period, makeHref }: PopularPostsListProps) {
  return (
    <div className="panel-surface space-y-4 rounded-[1.75rem] p-5">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Popular rank</p>
        <h2 className="mt-2 text-2xl text-[var(--color-cream)]">热门文章榜</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {([
          ["all", "全部"],
          ["7d", "近 7 天"],
          ["30d", "近 30 天"],
        ] as const).map(([value, label]) => (
          <Link key={value} href={makeHref(value)} className={`rounded-full px-3 py-1 text-sm ${period === value ? "bg-[var(--color-gold)] text-[var(--color-ink)]" : "border border-white/10 text-[var(--color-muted)]"}`}>
            {label}
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {posts.map((post, index) => (
          <Link key={post.id} href={`/posts/${post.slug}`} className="block rounded-[1.25rem] p-4 transition hover:border-[var(--color-gold)]/40 hover:bg-[var(--button-ghost)]" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}>
            <div className="flex items-start gap-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(212,177,106,0.16)] text-sm font-semibold text-[var(--color-cream)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-medium text-[var(--color-cream)]">{post.title}</h3>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{formatDate(post.createdAt)} · 访问 {post._count.visits} · 点赞 {post._count.reactions} · 评论 {post._count.comments}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
