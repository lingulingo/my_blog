import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

const reactionSchema = z.object({
  postId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = reactionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "参数不合法" }, { status: 400 });
  }

  const existing = await prisma.reaction.findUnique({
    where: {
      postId_userId: {
        postId: parsed.data.postId,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.reaction.create({
    data: {
      postId: parsed.data.postId,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ liked: true });
}
