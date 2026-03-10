import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/auth";
import { PostEditorForm } from "@/components/dashboard/post-editor-form";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditorPage({ params }: PageProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const { id } = await params;
  const post =
    id === "new"
      ? null
      : await prisma.post.findFirst({
          where: { id, authorId: session.user.id },
        });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Editor</p>
        <h1 className="mt-2 text-4xl text-[var(--color-cream)]">{post ? "编辑文章" : "新建文章"}</h1>
      </div>
      <PostEditorForm post={post} categories={categories} />
    </div>
  );
}
