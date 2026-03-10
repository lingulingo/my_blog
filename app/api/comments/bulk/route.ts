import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(["APPROVED", "REJECTED", "DELETE"]),
});

export async function PATCH(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bulkSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { id: { in: parsed.data.ids } },
    include: { post: true },
  });

  const allowedIds = comments
    .filter((comment) => session.user.role === "ADMIN" || comment.post.authorId === session.user.id)
    .map((comment) => comment.id);

  if (allowedIds.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.action === "DELETE") {
    await prisma.comment.deleteMany({ where: { id: { in: allowedIds } } });
  } else {
    await prisma.comment.updateMany({ where: { id: { in: allowedIds } }, data: { status: parsed.data.action } });
  }

  return NextResponse.json({ ok: true, count: allowedIds.length });
}
