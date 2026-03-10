import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { id } = await context.params;
  await prisma.friendLink.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  await prisma.friendLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
