"use client";

import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const IMAGE_PLACEHOLDER_PREFIX = "BLOGIMAGEPLACEHOLDER";

function createTurndownService() {
  const service = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    headingStyle: "atx",
    hr: "---",
    strongDelimiter: "**",
  });

  service.use(gfm);

  service.addRule("lineBreak", {
    filter: "br",
    replacement: () => "  \n",
  });

  service.addRule("feishuParagraphSpacing", {
    filter: ["div", "section"],
    replacement: (content, node) => {
      const element = node as HTMLElement;
      if (element.querySelector("table, ul, ol, pre, blockquote")) {
        return `\n${content}\n`;
      }

      return `${content}\n`;
    },
  });

  service.addRule("emptyParagraph", {
    filter: "p",
    replacement: (content) => (content.trim() ? `\n\n${content}\n\n` : "\n"),
  });

  return service;
}

function dataUrlToFile(dataUrl: string, filename: string) {
  const [meta, data] = dataUrl.split(",");
  if (!meta || !data) {
    throw new Error("无效的图片数据");
  }

  const mimeMatch = meta.match(/data:([^;]+);base64/);
  const mimeType = mimeMatch?.[1] || "image/png";
  const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
  return new File([bytes], filename, { type: mimeType });
}

async function blobUrlToFile(blobUrl: string, filename: string) {
  const response = await fetch(blobUrl);
  if (!response.ok) {
    throw new Error("无法读取剪贴板中的图片");
  }

  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

function sanitizeMarkdownText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function buildMarkdownImage(alt: string, url: string) {
  const safeAlt = alt.replace(/[\[\]]/g, "").trim() || "image";
  return `![${safeAlt}](${url})`;
}

type ConvertOptions = {
  html: string;
  plainText: string;
  files: File[];
  uploadFile: (file: File) => Promise<string>;
  importRemoteImage: (url: string) => Promise<string>;
};

export async function convertRichClipboardToMarkdown(options: ConvertOptions) {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(options.html, "text/html");

  documentNode.querySelectorAll("script, style, meta, link").forEach((node) => node.remove());

  const imageFiles = options.files.filter((file) => file.type.startsWith("image/"));
  let imageFileIndex = 0;

  const placeholders = Array.from(documentNode.body.querySelectorAll("img")).map((img, index) => {
    const placeholder = `${IMAGE_PLACEHOLDER_PREFIX}${index}TOKEN`;
    const src = img.getAttribute("src") || "";
    const alt = img.getAttribute("alt") || "image";

    const uploadPromise = (async () => {
      if (src.startsWith("data:image/")) {
        return options.uploadFile(dataUrlToFile(src, `pasted-image-${index}.png`));
      }

      if (src.startsWith("blob:")) {
        return options.uploadFile(await blobUrlToFile(src, `pasted-image-${index}.png`));
      }

      if (/^https?:\/\//i.test(src)) {
        try {
          return await options.importRemoteImage(src);
        } catch {
          if (imageFiles[imageFileIndex]) {
            return options.uploadFile(imageFiles[imageFileIndex++]);
          }
          throw new Error("远程图片导入失败");
        }
      }

      if (src.startsWith("/api/uploads/") || src.startsWith("/uploads/")) {
        return src;
      }

      if (imageFiles[imageFileIndex]) {
        return options.uploadFile(imageFiles[imageFileIndex++]);
      }

      return "";
    })();

    img.replaceWith(documentNode.createTextNode(placeholder));

    return { alt, placeholder, uploadPromise };
  });

  const extraImageFiles = imageFiles.slice(imageFileIndex);
  if (extraImageFiles.length > 0) {
    const extraPlaceholders = await Promise.all(
      extraImageFiles.map(async (file, index) => {
        const placeholder = `${IMAGE_PLACEHOLDER_PREFIX}${placeholders.length + index}TOKEN`;
        const paragraph = documentNode.createElement("p");
        paragraph.textContent = placeholder;
        documentNode.body.append(paragraph);
        return {
          alt: file.name || "image",
          placeholder,
          uploadPromise: options.uploadFile(file),
        };
      }),
    );
    placeholders.push(...extraPlaceholders);
  }

  const turndownService = createTurndownService();
  let markdown = sanitizeMarkdownText(turndownService.turndown(documentNode.body.innerHTML));

  for (const item of placeholders) {
    const uploadedUrl = await item.uploadPromise.catch(() => "");
    const replacement = uploadedUrl ? buildMarkdownImage(item.alt, uploadedUrl) : item.alt;
    markdown = markdown.replaceAll(item.placeholder, replacement);
  }

  if (!markdown) {
    return sanitizeMarkdownText(options.plainText);
  }

  return markdown.replace(/\n{3,}/g, "\n\n").trim();
}
