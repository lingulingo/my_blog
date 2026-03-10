import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

const commentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(2).max(1000),
});

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = commentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "参数不合法" }, { status: 400 });
  }

  await prisma.comment.create({
    data: {
      postId: parsed.data.postId,
      content: parsed.data.content,
      authorId: session.user.id,
      status: "APPROVED",
    },
  });

  return NextResponse.json({ ok: true, message: "留言已发布" });
}
