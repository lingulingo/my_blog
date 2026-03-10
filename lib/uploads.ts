import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { nanoid } from "nanoid";
import sharp from "sharp";

const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export async function saveUpload(file: File, directory: "avatars" | "posts") {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name).toLowerCase() || ".png";

  if (!allowedExt.has(ext)) {
    throw new Error("Unsupported file type");
  }

  const folder = path.join(process.cwd(), "public", "uploads", directory);
  await mkdir(folder, { recursive: true });

  let outputBuffer = inputBuffer;
  let outputExt = ext;

  if (directory === "avatars") {
    outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize(256, 256, { fit: "cover", position: "attention", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    outputExt = ".webp";
  }

  const filename = `${nanoid(12)}${outputExt}`;
  await writeFile(path.join(folder, filename), outputBuffer);

  return `/api/uploads/${directory}/${filename}`;
}
