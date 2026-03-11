import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { nanoid } from "nanoid";
import sharp from "sharp";

const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const mimeTypeToExt: Record<string, string> = {
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const POST_COVER_WIDTH = 1600;
const POST_COVER_HEIGHT = 900;

function resolveUploadExtension(options: { filename?: string; mimeType?: string }) {
  const filenameExt = path.extname(options.filename || "").toLowerCase();
  if (filenameExt && allowedExt.has(filenameExt)) {
    return filenameExt;
  }

  const mimeExt = options.mimeType ? mimeTypeToExt[options.mimeType.toLowerCase()] : undefined;
  if (mimeExt && allowedExt.has(mimeExt)) {
    return mimeExt;
  }

  return ".png";
}

async function processPostCover(inputBuffer: Uint8Array) {
  const image = sharp(inputBuffer).rotate();
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  return image
    .resize(POST_COVER_WIDTH, POST_COVER_HEIGHT, { fit: "cover", position: "attention" })
    .sharpen({ sigma: width && height && height > width ? 1.25 : 1.05, m1: 0.8, m2: 2.6 })
    .webp({ quality: 92 })
    .toBuffer();
}

export async function saveUploadBuffer(
  inputBuffer: Uint8Array,
  directory: "avatars" | "posts",
  options: { filename?: string; mimeType?: string } = {},
) {
  const ext = resolveUploadExtension(options);

  if (!allowedExt.has(ext)) {
    throw new Error("Unsupported file type");
  }

  const folder = path.join(process.cwd(), "public", "uploads", directory);
  await mkdir(folder, { recursive: true });

  let outputBuffer: Uint8Array = inputBuffer;
  let outputExt = ext;

  if (directory === "avatars" && ext !== ".gif") {
    outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize(256, 256, { fit: "cover", position: "attention", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    outputExt = ".webp";
  } else if (directory === "posts" && ext !== ".gif") {
    outputBuffer = await processPostCover(inputBuffer);
    outputExt = ".webp";
  }

  const filename = `${nanoid(12)}${outputExt}`;
  await writeFile(path.join(folder, filename), outputBuffer);

  return `/api/uploads/${directory}/${filename}`;
}

export async function saveUpload(file: File, directory: "avatars" | "posts") {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  return saveUploadBuffer(inputBuffer, directory, {
    filename: file.name,
    mimeType: file.type,
  });
}
