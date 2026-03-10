import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).max(40),
  url: z.string().url(),
  description: z.string().min(5).max(240),
  avatar: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const link = await prisma.friendLink.create({
    data: {
      name: parsed.data.name,
      url: parsed.data.url,
      description: parsed.data.description,
      avatar: parsed.data.avatar || null,
      sortOrder: parsed.data.sortOrder,
    },
  });

  return NextResponse.json({ ok: true, id: link.id });
}
