"use client";

import { useMemo, useState } from "react";

type ToolId =
  | "json-format"
  | "json-diff"
  | "header-format"
  | "cookie-format"
  | "dict-format"
  | "js-format"
  | "html-format"
  | "curl-to-requests"
  | "curl-to-feapder"
  | "url-query"
  | "url-encode"
  | "url-decode"
  | "html-render"
  | "text-decode";

type ToolItem = {
  id: ToolId;
  label: string;
  placeholder: string;
};

const tools: ToolItem[] = [
  { id: "json-format", label: "JSON格式化", placeholder: '{"name":"lingu","count":1}' },
  { id: "json-diff", label: "JSON对比", placeholder: '左侧JSON\n---\n右侧JSON' },
  { id: "header-format", label: "Header格式化", placeholder: "Content-Type: application/json\nAuthorization: Bearer token" },
  { id: "cookie-format", label: "Cookie格式化", placeholder: "name=lingu; token=abc123; theme=dark" },
  { id: "dict-format", label: "Dict格式化", placeholder: "{'name': 'lingu', 'active': True, 'count': 2}" },
  { id: "js-format", label: "JS格式化", placeholder: "const x={a:1,b:[2,3]};function hi(n){return `hi ${n}`;}" },
  { id: "html-format", label: "HTML格式化", placeholder: "<div><h1>Hello</h1><p>world</p></div>" },
  { id: "curl-to-requests", label: "curl转requests", placeholder: "curl 'https://example.com/api' -H 'Accept: application/json'" },
  { id: "curl-to-feapder", label: "curl转feapder", placeholder: "curl 'https://example.com/api' -H 'Accept: application/json'" },
  { id: "url-query", label: "url参数提取", placeholder: "https://example.com/path?a=1&b=hello%20world" },
  { id: "url-encode", label: "url编码", placeholder: "https://www.baidu.com/s?wd=你好" },
  { id: "url-decode", label: "url解码", placeholder: "https%3A%2F%2Fwww.baidu.com%2Fs%3Fwd%3D%E4%BD%A0%E5%A5%BD" },
  { id: "html-render", label: "html渲染", placeholder: "<h2>预览区</h2><p style='color:#d4b16a'>支持实时渲染</p>" },
  { id: "text-decode", label: "文本解码", placeholder: "\\u4f60\\u597d 或 SGVsbG8gd29ybGQ=" },
];

function splitByDivider(input: string) {
  const normalized = input.replace(/\r\n/g, "\n");
  const splitIndex = normalized.indexOf("\n---\n");
  if (splitIndex === -1) {
    throw new Error("请使用 \\n---\\n 分隔两段 JSON");
  }
  const left = normalized.slice(0, splitIndex).trim();
  const right = normalized.slice(splitIndex + 5).trim();
  if (!left || !right) {
    throw new Error("分隔线两侧都需要 JSON 内容");
  }
  return [left, right] as const;
}

function diffJson(a: unknown, b: unknown, prefix = ""): string[] {
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      return [`~ ${prefix || "(root)"}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`];
    }
    return [];
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
  const lines: string[] = [];

  for (const key of keys) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (!(key in aObj)) {
      lines.push(`+ ${nextPrefix}: ${JSON.stringify(bObj[key])}`);
      continue;
    }
    if (!(key in bObj)) {
      lines.push(`- ${nextPrefix}: ${JSON.stringify(aObj[key])}`);
      continue;
    }
    lines.push(...diffJson(aObj[key], bObj[key], nextPrefix));
  }
  return lines;
}

function formatJson(input: string) {
  return JSON.stringify(JSON.parse(input), null, 2);
}

function formatHeaders(input: string) {
  const output: Record<string, string> = {};
  for (const line of input.split(/\r?\n/)) {
    const row = line.trim();
    if (!row) continue;
    const index = row.indexOf(":");
    if (index === -1) continue;
    const key = row.slice(0, index).trim();
    const value = row.slice(index + 1).trim();
    if (key) output[key] = value;
  }
  return JSON.stringify(output, null, 2);
}

function formatCookies(input: string) {
  const output: Record<string, string> = {};
  for (const token of input.split(";")) {
    const row = token.trim();
    if (!row) continue;
    const index = row.indexOf("=");
    if (index === -1) continue;
    const key = row.slice(0, index).trim();
    const value = row.slice(index + 1).trim();
    if (key) output[key] = value;
  }
  return JSON.stringify(output, null, 2);
}

function formatDict(input: string) {
  const normalized = input
    .trim()
    .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":')
    .replace(/:\s*'([^']*?)'/g, ': "$1"')
    .replace(/\bNone\b/g, "null")
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false");
  return JSON.stringify(JSON.parse(normalized), null, 2);
}

function formatJs(input: string) {
  const code = input.replace(/\r\n/g, "\n").trim();
  let indent = 0;
  const lines: string[] = [];
  const tokens = code
    .replace(/;/g, ";\n")
    .replace(/\{/g, "{\n")
    .replace(/\}/g, "\n}\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const token of tokens) {
    if (token.startsWith("}")) indent = Math.max(0, indent - 1);
    lines.push(`${"  ".repeat(indent)}${token}`);
    if (token.endsWith("{")) indent += 1;
  }
  return lines.join("\n");
}

function formatHtml(input: string) {
  const html = input.replace(/>\s+</g, "><").trim();
  const tokens = html.match(/<\/?[^>]+>|[^<]+/g) || [];
  const lines: string[] = [];
  let indent = 0;

  for (const raw of tokens) {
    const token = raw.trim();
    if (!token) continue;
    const isClose = /^<\//.test(token);
    const isSelf = /\/>$/.test(token);
    const isOpen = /^<[^/!][^>]*>$/.test(token);
    if (isClose) indent = Math.max(0, indent - 1);
    lines.push(`${"  ".repeat(indent)}${token}`);
    if (isOpen && !isSelf) indent += 1;
  }
  return lines.join("\n");
}

function tokenizeCurl(curl: string) {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < curl.length; i += 1) {
    const char = curl[i];
    if ((char === "'" || char === '"') && (!quote || quote === char)) {
      if (quote === char) {
        quote = null;
      } else {
        quote = char;
      }
      continue;
    }
    if (!quote && /\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

function parseCurl(input: string) {
  const tokens = tokenizeCurl(input.trim());
  if (!tokens.length || tokens[0] !== "curl") {
    throw new Error("请输入合法的 curl 命令");
  }

  let method = "GET";
  let url = "";
  let data = "";
  const headers: Record<string, string> = {};

  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i];
    if ((token === "-X" || token === "--request") && tokens[i + 1]) {
      method = tokens[i + 1].toUpperCase();
      i += 1;
      continue;
    }
    if ((token === "-H" || token === "--header") && tokens[i + 1]) {
      const raw = tokens[i + 1];
      const idx = raw.indexOf(":");
      if (idx !== -1) {
        headers[raw.slice(0, idx).trim()] = raw.slice(idx + 1).trim();
      }
      i += 1;
      continue;
    }
    if ((token === "-d" || token === "--data" || token === "--data-raw") && tokens[i + 1]) {
      data = tokens[i + 1];
      if (method === "GET") method = "POST";
      i += 1;
      continue;
    }
    if (/^https?:\/\//i.test(token)) {
      url = token;
    }
  }

  if (!url) {
    throw new Error("curl 命令缺少 URL");
  }

  return { method, url, headers, data };
}

function curlToRequests(input: string) {
  const parsed = parseCurl(input);
  const headerBlock =
    Object.keys(parsed.headers).length > 0
      ? `headers = ${JSON.stringify(parsed.headers, null, 2)}\n`
      : "";
  const dataBlock = parsed.data ? `data = ${JSON.stringify(parsed.data)}\n` : "";

  return [
    "import requests",
    "",
    headerBlock + dataBlock + `response = requests.${parsed.method.toLowerCase()}(`,
    `    ${JSON.stringify(parsed.url)},`,
    Object.keys(parsed.headers).length > 0 ? "    headers=headers," : "",
    parsed.data ? "    data=data," : "",
    ")",
    "print(response.status_code)",
    "print(response.text)",
  ]
    .filter(Boolean)
    .join("\n");
}

function curlToFeapder(input: string) {
  const parsed = parseCurl(input);
  const lines = [
    "import feapder",
    "",
    "class DemoSpider(feapder.AirSpider):",
    "    def start_requests(self):",
    "        yield feapder.Request(",
    `            url=${JSON.stringify(parsed.url)},`,
    `            method=${JSON.stringify(parsed.method)},`,
  ];
  if (Object.keys(parsed.headers).length > 0) {
    lines.push(`            headers=${JSON.stringify(parsed.headers, null, 12)},`);
  }
  if (parsed.data) {
    lines.push(`            data=${JSON.stringify(parsed.data)},`);
  }
  lines.push(
    "        )",
    "",
    "    def parse(self, request, response):",
    "        print(response.status_code)",
    "        print(response.text)",
  );
  return lines.join("\n");
}

function extractUrlQuery(input: string) {
  const url = new URL(input.trim());
  const output: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    output[key] = value;
  });
  return JSON.stringify(output, null, 2);
}

function decodeUnicodeEscapes(input: string) {
  return input.replace(/\\u([\dA-Fa-f]{4})/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16)),
  );
}

function decodeBase64(input: string) {
  const raw = atob(input);
  const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function runTool(tool: ToolId, input: string) {
  const value = input.trim();
  if (!value) {
    return { output: "", htmlPreview: "" };
  }

  switch (tool) {
    case "json-format":
      return { output: formatJson(value), htmlPreview: "" };
    case "json-diff": {
      const [leftText, rightText] = splitByDivider(value);
      const left = JSON.parse(leftText);
      const right = JSON.parse(rightText);
      const lines = diffJson(left, right);
      return { output: lines.length ? lines.join("\n") : "两段 JSON 内容一致", htmlPreview: "" };
    }
    case "header-format":
      return { output: formatHeaders(value), htmlPreview: "" };
    case "cookie-format":
      return { output: formatCookies(value), htmlPreview: "" };
    case "dict-format":
      return { output: formatDict(value), htmlPreview: "" };
    case "js-format":
      return { output: formatJs(value), htmlPreview: "" };
    case "html-format":
      return { output: formatHtml(value), htmlPreview: "" };
    case "curl-to-requests":
      return { output: curlToRequests(value), htmlPreview: "" };
    case "curl-to-feapder":
      return { output: curlToFeapder(value), htmlPreview: "" };
    case "url-query":
      return { output: extractUrlQuery(value), htmlPreview: "" };
    case "url-encode":
      return { output: encodeURIComponent(value), htmlPreview: "" };
    case "url-decode":
      return { output: decodeURIComponent(value), htmlPreview: "" };
    case "html-render":
      return { output: formatHtml(value), htmlPreview: value };
    case "text-decode": {
      let decoded = value;
      try {
        decoded = decodeURIComponent(decoded);
      } catch {
        // noop
      }
      if (/\\u[\dA-Fa-f]{4}/.test(decoded)) {
        decoded = decodeUnicodeEscapes(decoded);
      } else {
        try {
          decoded = decodeBase64(decoded);
        } catch {
          // noop
        }
      }
      return { output: decoded, htmlPreview: "" };
    }
    default:
      return { output: "", htmlPreview: "" };
  }
}

export function ToolLab() {
  const [activeTool, setActiveTool] = useState<ToolId>("url-decode");
  const [input, setInput] = useState("https%3A%2F%2Fwww.baidu.com%2Fs%3Fwd%3D%E4%BD%A0%E5%A5%BD");

  const toolMeta = tools.find((item) => item.id === activeTool)!;

  const result = useMemo(() => {
    try {
      return { ...runTool(activeTool, input), error: "" };
    } catch (error) {
      return {
        output: "",
        htmlPreview: "",
        error: error instanceof Error ? error.message : "处理失败",
      };
    }
  }, [activeTool, input]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-gold)]">Toolbox</p>
        <h1 className="mt-2 text-4xl text-[var(--color-cream)]">爬虫工具库</h1>
        <p className="mt-3 text-sm text-[var(--color-muted)]">左侧选择工具，中间输入内容，右侧实时输出结果。</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[220px_1fr_1fr]">
        <aside className="panel-surface rounded-[1.5rem] p-3">
          <div className="space-y-1">
            {tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setActiveTool(tool.id);
                  setInput(tool.placeholder);
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  activeTool === tool.id
                    ? "bg-[var(--color-gold)] text-[var(--color-ink)]"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-panel-soft)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="panel-surface rounded-[1.5rem] p-4">
          <p className="mb-3 text-sm text-[var(--color-muted)]">输入（{toolMeta.label}）</p>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={toolMeta.placeholder}
            className="min-h-[560px] w-full rounded-[1.1rem] px-4 py-3 font-mono text-sm outline-none"
            style={{
              border: "1px solid var(--color-line)",
              background: "var(--button-ghost)",
              color: "var(--color-foreground)",
            }}
          />
        </section>

        <section className="panel-surface rounded-[1.5rem] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-[var(--color-muted)]">输出</p>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(result.output || result.error || "")}
              className="rounded-full px-3 py-1 text-xs text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
              style={{ border: "1px solid var(--color-line)" }}
            >
              复制结果
            </button>
          </div>

          {activeTool === "html-render" && result.htmlPreview ? (
            <iframe
              title="html-render-preview"
              srcDoc={result.htmlPreview}
              className="h-[560px] w-full rounded-[1.1rem]"
              style={{ border: "1px solid var(--color-line)", background: "#fff" }}
            />
          ) : (
            <pre
              className={`min-h-[560px] overflow-auto rounded-[1.1rem] px-4 py-3 font-mono text-sm whitespace-pre-wrap ${
                result.error ? "text-red-400" : "text-[var(--color-foreground)]"
              }`}
              style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)" }}
            >
              {result.error || result.output || "等待输入..."}
            </pre>
          )}
        </section>
      </div>
    </div>
  );
}

