import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { nanoid } from "nanoid";

const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export async function saveUpload(file: File, directory: "avatars" | "posts") {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name).toLowerCase() || ".png";

  if (!allowedExt.has(ext)) {
    throw new Error("Unsupported file type");
  }

  const folder = path.join(process.cwd(), "public", "uploads", directory);
  await mkdir(folder, { recursive: true });

  const filename = `${nanoid(12)}${ext}`;
  await writeFile(path.join(folder, filename), buffer);

  return `/uploads/${directory}/${filename}`;
}
