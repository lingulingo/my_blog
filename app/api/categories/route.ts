import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { makeSlug } from "@/lib/utils";

const schema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().min(2).max(40),
  slug: z.string().min(2).max(60),
  description: z.string().max(240).nullable().optional(),
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

  const data = {
    name: parsed.data.name,
    slug: makeSlug(parsed.data.slug),
    description: parsed.data.description || null,
  };

  if (parsed.data.id) {
    await prisma.category.update({ where: { id: parsed.data.id }, data });
  } else {
    await prisma.category.create({ data });
  }

  return NextResponse.json({ ok: true });
}
