import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const allowedDirectories = new Set(["avatars", "posts"]);
const contentTypes: Record<string, string> = {
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ directory: string; filename: string }> },
) {
  const { directory, filename } = await context.params;

  if (!allowedDirectories.has(directory)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = contentTypes[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", directory, path.basename(filename));

  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
