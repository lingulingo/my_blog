import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/auth";
import { canManagePost } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { excerptFromHtml, excerptFromMarkdown, makeSlug } from "@/lib/utils";

const fieldLabels: Record<string, string> = {
  title: "标题",
  excerpt: "摘要",
  tags: "标签",
  categoryId: "分类",
  coverImage: "封面图",
  content: "正文",
  contentFormat: "内容格式",
  published: "发布状态",
};

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "标题至少需要 3 个字").max(120, "标题不能超过 120 个字"),
  excerpt: z.string().trim().max(220, "摘要不能超过 220 个字").optional().nullable().transform((value) => value ?? ""),
  tags: z.string().trim().max(120, "标签不能超过 120 个字"),
  categoryId: z.string().nullable().optional(),
  coverImage: z.string().optional().nullable(),
  content: z.string().trim(),
  contentFormat: z.enum(["HTML", "MARKDOWN"]).default("HTML"),
  published: z.boolean(),
});

function getPostValidationErrorMessage(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) {
    return "文章数据不完整";
  }

  if (issue.message && issue.message !== "Invalid input") {
    return issue.message;
  }

  const field = fieldLabels[String(issue.path[0] ?? "")] || "提交内容";

  switch (issue.code) {
    case "invalid_type":
      return `${field}格式不正确`;
    case "invalid_value":
      return `${field}不支持当前取值`;
    case "too_small":
      return `${field}内容过短`;
    case "too_big":
      return `${field}内容过长`;
    default:
      return `${field}填写不合法`;
  }
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: getPostValidationErrorMessage(parsed.error) }, { status: 400 });
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
      parsed.data.excerpt.trim() ||
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
