import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/auth";
import { CommentDeleteButton } from "@/components/dashboard/comment-delete-button";
import { Pagination } from "@/components/pagination";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

type CommentPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function DashboardCommentsPage({ searchParams }: CommentPageProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = 12;

  const [comments, totalComments] = await Promise.all([
    prisma.comment.findMany({
      include: { author: true, post: true },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.comment.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalComments / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Comment board</p>
          <h1 className="mt-2 text-4xl text-[var(--color-cream)]">留言管理</h1>
        </div>
        <Link href="/dashboard" className="rounded-full px-4 py-2 text-sm" style={{ border: "1px solid var(--color-line)", color: "var(--color-foreground)" }}>
          返回控制台
        </Link>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-[1.5rem] p-5" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-medium text-[var(--color-cream)]">{comment.author.name}</p>
                  <span className="text-xs text-[var(--color-muted)]">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-muted)]">文章：{comment.post.title}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--color-foreground)]/85">{comment.content}</p>
              </div>
              <CommentDeleteButton commentId={comment.id} />
            </div>
          </article>
        ))}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} makeHref={(nextPage) => `/dashboard/comments?page=${nextPage}`} />
    </div>
  );
}
