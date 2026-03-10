import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  const json = (await request.json()) as { postId?: string; path?: string };
  const headers = request.headers;
  const rawVisitor = `${headers.get("x-forwarded-for") || "local"}:${headers.get("user-agent") || "ua"}`;
  const visitorKey = createHash("sha1").update(rawVisitor).digest("hex");

  await prisma.visit.create({
    data: {
      path: json.path || "/",
      postId: json.postId,
      userId: session?.user?.id,
      visitorKey,
    },
  });

  return NextResponse.json({ ok: true });
}
