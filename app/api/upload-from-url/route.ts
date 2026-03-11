import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/auth";
import { saveUploadBuffer } from "@/lib/uploads";

const requestSchema = z.object({
  kind: z.enum(["avatars", "posts"]),
  url: z.string().url(),
});

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const remoteUrl = new URL(parsed.data.url);
  if (!["http:", "https:"].includes(remoteUrl.protocol)) {
    return NextResponse.json({ error: "Unsupported URL" }, { status: 400 });
  }

  const response = await fetch(remoteUrl, {
    headers: {
      "User-Agent": "blog-system-image-importer",
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "远程图片下载失败" }, { status: 400 });
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "远程资源不是图片" }, { status: 400 });
  }

  const arrayBuffer = await response.arrayBuffer();
  const url = await saveUploadBuffer(Buffer.from(arrayBuffer), parsed.data.kind, {
    filename: remoteUrl.pathname,
    mimeType: contentType,
  });

  return NextResponse.json({ url });
}
