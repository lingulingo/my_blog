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

function isCodeLikeLine(line: string) {
  const text = line.trim();
  if (!text) return false;
  if (/^```/.test(text)) return false;
  if (/^[\[\]{}();.,:=+\-*/%<>!&|'"`\\]+$/.test(text)) return true;
  if (/^(const|let|var|function|class|import|export|return|if|for|while|switch|case|try|catch)\b/.test(text)) return true;
  if (/^(def|class|from|import|return|if|elif|else|for|while|try|except|with)\b/.test(text)) return true;
  if (/^\s{2,}\S+/.test(line)) return true;
  if (/(=>|===|!==|==|!=|&&|\|\||::|->|:=)/.test(text)) return true;
  if (/[{}()[\];]/.test(text) && /[A-Za-z_$]/.test(text)) return true;
  if (/^[A-Za-z_$][\w$]*\s*[:=]\s*.+/.test(text)) return true;
  return false;
}

function detectCodeLanguage(blockText: string) {
  if (/\b(def|import|from|elif|except|None|True|False)\b/.test(blockText)) return "python";
  if (/\b(function|const|let|var|=>|console\.|document\.|window\.)\b/.test(blockText)) return "javascript";
  if (/<\/?[a-z][^>]*>/i.test(blockText)) return "html";
  if (/\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN)\b/i.test(blockText)) return "sql";
  if (/\b(package|func|fmt\.|err != nil)\b/.test(blockText)) return "go";
  return "";
}

function wrapCodeBlocks(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const result: string[] = [];
  let i = 0;
  let inFence = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      result.push(line);
      i += 1;
      continue;
    }

    if (!inFence && isCodeLikeLine(line)) {
      let j = i;
      const block: string[] = [];
      while (j < lines.length) {
        const current = lines[j];
        if (!current.trim()) {
          break;
        }
        if (!isCodeLikeLine(current)) {
          break;
        }
        block.push(current);
        j += 1;
      }

      if (block.length >= 2) {
        const blockText = block.join("\n");
        const lang = detectCodeLanguage(blockText);
        result.push(`\`\`\`${lang}`);
        result.push(...block);
        result.push("```");
        i = j;
        continue;
      }
    }

    result.push(line);
    i += 1;
  }

  return result.join("\n");
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
    return wrapCodeBlocks(sanitizeMarkdownText(options.plainText));
  }

  return wrapCodeBlocks(markdown.replace(/\n{3,}/g, "\n\n").trim());
}
