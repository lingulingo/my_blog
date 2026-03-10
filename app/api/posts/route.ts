import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/auth";
import { canManagePost } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { excerptFromHtml, excerptFromMarkdown, makeSlug } from "@/lib/utils";

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3).max(120),
  excerpt: z.string().min(20).max(220),
  tags: z.string().max(120),
  categoryId: z.string().nullable().optional(),
  coverImage: z.string().optional().nullable(),
  content: z.string().min(20),
  contentFormat: z.enum(["HTML", "MARKDOWN"]).default("HTML"),
  published: z.boolean(),
});

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "文章数据不完整" }, { status: 400 });
  }

  if (parsed.data.id) {
    const allowed = await canManagePost(session.user.id, parsed.data.id, session.user.role);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const baseSlug = makeSlug(parsed.data.title);
  const slug = parsed.data.id ? baseSlug : `${baseSlug}-${Date.now().toString().slice(-5)}`;

  const data = {
    title: parsed.data.title,
    slug,
    excerpt:
      parsed.data.excerpt ||
      (parsed.data.contentFormat === "MARKDOWN"
        ? excerptFromMarkdown(parsed.data.content)
        : excerptFromHtml(parsed.data.content)),
    tags: parsed.data.tags,
    categoryId: parsed.data.categoryId || null,
    coverImage: parsed.data.coverImage || null,
    content: parsed.data.content,
    contentFormat: parsed.data.contentFormat,
    published: parsed.data.published,
  };

  const post = parsed.data.id
    ? await prisma.post.update({
        where: { id: parsed.data.id },
        data,
      })
    : await prisma.post.create({
        data: {
          ...data,
          authorId: session.user.id,
        },
      });

  return NextResponse.json({ ok: true, slug: post.slug });
}

export async function PATCH(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { avatar } = (await request.json()) as { avatar?: string };
  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatar: avatar || null },
  });

  return NextResponse.json({ ok: true });
}
