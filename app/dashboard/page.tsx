import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/auth";
import { CategoryManager } from "@/components/dashboard/category-manager";
import { CommentDeleteButton } from "@/components/dashboard/comment-delete-button";
import { FriendLinkManager } from "@/components/dashboard/friend-link-manager";
import { PostDeleteButton } from "@/components/dashboard/post-delete-button";
import { ProfileAvatarForm } from "@/components/dashboard/profile-avatar-form";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [user, posts, visitCount, reactionCount, recentComments, friendLinks, categories] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.post.findMany({
      where: { authorId: session.user.id },
      include: { category: true, _count: { select: { comments: true, visits: true, reactions: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.visit.count({ where: { userId: session.user.id } }),
    prisma.reaction.count({ where: { userId: session.user.id } }),
    prisma.comment.findMany({ include: { author: true, post: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.friendLink.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.category.findMany({ include: { _count: { select: { posts: true } } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="panel-surface rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Linghan Valley Studio</p>
          <h1 className="mt-3 text-4xl text-[var(--color-cream)]">你好，{user.name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">这里是灵寒谷的写作台，你可以整理文章、维护分类、查看点赞与访问走势，也能顺手清理留言区。</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.25rem] p-4" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}><p className="text-sm text-[var(--color-muted)]">我的文章</p><p className="mt-2 text-2xl text-[var(--color-cream)]">{posts.length}</p></div>
            <div className="rounded-[1.25rem] p-4" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}><p className="text-sm text-[var(--color-muted)]">收到点赞</p><p className="mt-2 text-2xl text-[var(--color-cream)]">{reactionCount}</p></div>
            <div className="rounded-[1.25rem] p-4" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}><p className="text-sm text-[var(--color-muted)]">访问记录</p><p className="mt-2 text-2xl text-[var(--color-cream)]">{visitCount}</p></div>
          </div>
          <Link href="/dashboard/editor/new" className="mt-6 inline-flex rounded-full bg-[var(--color-gold)] px-5 py-3 font-medium text-[var(--color-ink)]">
            写一篇新文章
          </Link>
          {session.user.role === "ADMIN" ? (
            <Link href="/dashboard/comments" className="mt-6 ml-3 inline-flex rounded-full px-5 py-3" style={{ border: "1px solid var(--color-line)", color: "var(--color-foreground)" }}>
              管理留言
            </Link>
          ) : null}
        </div>
        <ProfileAvatarForm currentAvatar={user.avatar} />
      </section>

      {session.user.role === "ADMIN" ? (
        <section className="panel-surface rounded-[2rem] p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Guestbook</p>
              <h2 className="mt-2 text-3xl text-[var(--color-cream)]">最新留言</h2>
            </div>
            <p className="text-sm text-[var(--color-muted)]">管理员可直接删除不需要的留言</p>
          </div>
          <div className="mt-6 space-y-4">
            {recentComments.map((comment) => (
              <article key={comment.id} className="flex flex-col gap-4 rounded-[1.5rem] p-5 md:flex-row md:items-start md:justify-between" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}>
                <div>
                  <p className="font-medium text-[var(--color-cream)]">{comment.author.name}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{comment.post.title}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--color-foreground)]/85">{comment.content}</p>
                </div>
                <CommentDeleteButton commentId={comment.id} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel-surface rounded-[2rem] p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Manage posts</p>
            <h2 className="mt-2 text-3xl text-[var(--color-cream)]">文章管理</h2>
          </div>
          <p className="text-sm text-[var(--color-muted)]">草稿和已发布文章统一管理</p>
        </div>
        <div className="mt-6 space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="flex flex-col gap-4 rounded-[1.5rem] p-5 md:flex-row md:items-center md:justify-between" style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">{post.published ? "Published" : "Draft"}</p>
                <h3 className="mt-2 text-2xl text-[var(--color-cream)]">{post.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{post.category?.name || "未分类"} · 更新于 {formatDate(post.updatedAt)} · 点赞 {post._count.reactions} · 访问 {post._count.visits}</p>
              </div>
              <div className="flex gap-3">
                <Link href={`/posts/${post.slug}`} className="rounded-full px-4 py-2 text-sm" style={{ border: "1px solid var(--color-line)", color: "var(--color-foreground)" }}>预览</Link>
                <Link href={`/dashboard/editor/${post.id}`} className="rounded-full bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]">编辑</Link>
                <PostDeleteButton postId={post.id} />
              </div>
            </article>
          ))}
          {posts.length === 0 ? <p className="text-sm text-[var(--color-muted)]">你还没有文章，先去写第一篇吧。</p> : null}
        </div>
      </section>

      {session.user.role === "ADMIN" ? (
        <>
          <section className="panel-surface rounded-[2rem] p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Categories</p>
                <h2 className="mt-2 text-3xl text-[var(--color-cream)]">分类管理</h2>
              </div>
              <p className="text-sm text-[var(--color-muted)]">新增、编辑、删除文章分类</p>
            </div>
            <div className="mt-6">
              <CategoryManager categories={categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug, description: category.description, postCount: category._count.posts }))} />
            </div>
          </section>

          <section className="panel-surface rounded-[2rem] p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Friend links</p>
                <h2 className="mt-2 text-3xl text-[var(--color-cream)]">友情链接管理</h2>
              </div>
              <p className="text-sm text-[var(--color-muted)]">新增、隐藏或删除外部站点入口</p>
            </div>
            <div className="mt-6">
              <FriendLinkManager links={friendLinks.map((link) => ({ id: link.id, name: link.name, url: link.url, description: link.description, avatar: link.avatar, sortOrder: link.sortOrder, isActive: link.isActive }))} />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
