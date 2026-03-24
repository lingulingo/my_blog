const FENCE_LANGUAGE_PATTERN = "[A-Za-z0-9_#+.-]+";

function normalizeFenceLine(markdown: string) {
  let next = markdown;

  next = next.replace(
    new RegExp(`^([ \\t]*)\\\\\`\\\\\`\\\\\`\\s*(${FENCE_LANGUAGE_PATTERN})?\\s*$`, "gm"),
    (_match, indent: string, language?: string) => `${indent}\`\`\`${language ?? ""}`,
  );

  next = next.replace(
    new RegExp(`^([ \\t]*)\\\\\`\\\\\`\\\\\`\\s*(${FENCE_LANGUAGE_PATTERN})\\s+(.+)$`, "gm"),
    (_match, indent: string, language: string, content: string) => `${indent}\`\`\`${language}\n${indent}${content}`,
  );

  next = next.replace(
    new RegExp(`^([ \\t]*)\`\`\`+\\s+(${FENCE_LANGUAGE_PATTERN})\\s*$`, "gm"),
    (_match, indent: string, language: string) => `${indent}\`\`\`${language}`,
  );

  next = next.replace(
    new RegExp(`^([ \\t]*)\`\`\`+\\s+(${FENCE_LANGUAGE_PATTERN})\\s+(.+)$`, "gm"),
    (_match, indent: string, language: string, content: string) => `${indent}\`\`\`${language}\n${indent}${content}`,
  );

  next = next.replace(
    new RegExp(`^([ \\t]*)\`\`\\s*(${FENCE_LANGUAGE_PATTERN})\\s*$`, "gm"),
    (_match, indent: string, language: string) => `${indent}\`\`\`${language}`,
  );

  next = next.replace(
    new RegExp(`^([ \\t]*)\`\`\\s*(${FENCE_LANGUAGE_PATTERN})\\s+(.+)$`, "gm"),
    (_match, indent: string, language: string, content: string) => `${indent}\`\`\`${language}\n${indent}${content}`,
  );

  return next;
}

function normalizeSingleLineFence(markdown: string) {
  return markdown.replace(
    new RegExp(
      `^([ \\t]*)(?:\\\\\`\\\\\`\\\\\`|\`\`\`+)\\s*(${FENCE_LANGUAGE_PATTERN})?\\s+(.+?)\\s*(?:\\\\\`\\\\\`\\\\\`|\`\`\`+)\\s*$`,
      "gm",
    ),
    (_match, indent: string, language: string | undefined, content: string) =>
      `${indent}\`\`\`${language ?? ""}\n${indent}${content}\n${indent}\`\`\``,
  );
}

export function normalizeMarkdownForDisplay(markdown: string) {
  let next = markdown.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\u2060]/g, "");

  next = normalizeSingleLineFence(next);
  next = normalizeFenceLine(next);

  return next;
}
