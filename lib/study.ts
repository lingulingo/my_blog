import { promises as fs } from "node:fs";
import path from "node:path";

const STUDY_ROOT = path.join(process.cwd(), "study");
const IGNORED_DIRECTORIES = new Set([".git", ".idea", "__pycache__", "node_modules"]);
const ALLOWED_EXTENSIONS = new Set([
  ".md",
  ".markdown",
  ".txt",
  ".py",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".html",
  ".css",
  ".json",
  ".sh",
  ".yaml",
  ".yml",
  ".sql",
  ".go",
  ".java",
  ".vue",
]);

export type StudyFileNode = {
  type: "file";
  name: string;
  label: string;
  extension: string;
  relativePath: string;
  slugSegments: string[];
  displaySegments: string[];
};

export type StudyDirectoryNode = {
  type: "directory";
  name: string;
  label: string;
  slugSegments: string[];
  displaySegments: string[];
  children: StudyNode[];
};

export type StudyNode = StudyFileNode | StudyDirectoryNode;

export type StudyNoteDetail = StudyFileNode & {
  content: string;
  updatedAt: Date;
  lineCount: number;
  isMarkdown: boolean;
};

type StudyIndex = {
  tree: StudyNode[];
  notes: StudyFileNode[];
};

const STUDY_CACHE_TTL_MS = 15_000;
let studyIndexCache: { value: StudyIndex; expiresAt: number } | null = null;

function decodeStudyFile(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString("utf8");
  }

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buffer.subarray(2));
  }

  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.from(buffer.subarray(2));
    for (let index = 0; index + 1 < swapped.length; index += 2) {
      const current = swapped[index];
      swapped[index] = swapped[index + 1];
      swapped[index + 1] = current;
    }
    return new TextDecoder("utf-16le").decode(swapped);
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("gb18030").decode(buffer);
  }
}

async function readStudyNote(relativePath: string) {
  const absolutePath = path.join(STUDY_ROOT, relativePath);
  const [buffer, stats] = await Promise.all([fs.readFile(absolutePath), fs.stat(absolutePath)]);
  const content = decodeStudyFile(buffer);

  return {
    content,
    stats,
  };
}

function formatStudyLabel(rawName: string) {
  const baseName = rawName.replace(path.extname(rawName), "");
  const cleaned = baseName
    .replace(/^\d+(?:[._\-\s]+)?/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || baseName;
}

function naturalCompare(a: string, b: string) {
  return a.localeCompare(b, "zh-Hans-CN", { numeric: true, sensitivity: "base" });
}

function isAllowedFile(name: string) {
  return ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase());
}

async function buildTree(currentDirectory: string, parentSegments: string[] = []): Promise<StudyNode[]> {
  const entries = await fs.readdir(currentDirectory, { withFileTypes: true });
  const nodes: StudyNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const absolutePath = path.join(currentDirectory, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const slugSegments = [...parentSegments, entry.name];
      const children = await buildTree(absolutePath, slugSegments);
      if (children.length > 0) {
        nodes.push({
          type: "directory",
          name: entry.name,
          label: formatStudyLabel(entry.name),
          slugSegments,
          displaySegments: [...parentSegments.map(formatStudyLabel), formatStudyLabel(entry.name)],
          children,
        });
      }
      continue;
    }

    if (!entry.isFile() || !isAllowedFile(entry.name)) {
      continue;
    }

    const relativePath = path.relative(STUDY_ROOT, absolutePath);
    const ext = path.extname(entry.name).replace(/^\./, "").toLowerCase();
    const basename = entry.name.replace(path.extname(entry.name), "");

    nodes.push({
      type: "file",
      name: entry.name,
      label: formatStudyLabel(entry.name),
      extension: ext,
      relativePath,
      slugSegments: [...parentSegments, entry.name],
      displaySegments: [...parentSegments.map(formatStudyLabel), formatStudyLabel(entry.name)],
    });
  }

  return nodes.sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === "directory" ? -1 : 1;
    }
    return naturalCompare(left.name, right.name);
  });
}

function flattenNotes(nodes: StudyNode[]): StudyFileNode[] {
  return nodes.flatMap((node) => {
    if (node.type === "file") {
      return [node];
    }
    return flattenNotes(node.children);
  });
}

async function getStudyIndex(): Promise<StudyIndex> {
  const now = Date.now();
  if (studyIndexCache && studyIndexCache.expiresAt > now) {
    return studyIndexCache.value;
  }

  try {
    const tree = await buildTree(STUDY_ROOT);
    const value = { tree, notes: flattenNotes(tree) };
    studyIndexCache = { value, expiresAt: now + STUDY_CACHE_TTL_MS };
    return value;
  } catch {
    return { tree: [], notes: [] };
  }
}

export async function getStudyTree() {
  return (await getStudyIndex()).tree;
}

export async function getStudyNotes() {
  return (await getStudyIndex()).notes;
}

export async function getStudyNoteDetail(slugSegments?: string[]) {
  const { notes } = await getStudyIndex();
  const selected =
    slugSegments && slugSegments.length > 0
      ? notes.find((note) => note.slugSegments.join("/") === slugSegments.join("/"))
      : notes[0];

  if (!selected) {
    return null;
  }

  const { content, stats } = await readStudyNote(selected.relativePath);

  return {
    ...selected,
    content,
    updatedAt: stats.mtime,
    lineCount: content.split(/\r?\n/).length,
    isMarkdown: ["md", "markdown"].includes(selected.extension),
  } satisfies StudyNoteDetail;
}

export async function getStudyPageData(slugSegments?: string[]) {
  const { tree, notes } = await getStudyIndex();
  const matchedNote =
    slugSegments && slugSegments.length > 0
      ? notes.find((note) => note.slugSegments.join("/") === slugSegments.join("/"))
      : null;
  const currentNote = matchedNote ?? notes[0];

  if (!currentNote) {
    return {
      tree,
      notes,
      currentNote: null,
    };
  }

  const { content, stats } = await readStudyNote(currentNote.relativePath);

  const detail: StudyNoteDetail = {
    ...currentNote,
    content,
    updatedAt: stats.mtime,
    lineCount: content.split(/\r?\n/).length,
    isMarkdown: ["md", "markdown"].includes(currentNote.extension),
  };

  return {
    tree,
    notes,
    currentNote: detail,
  };
}

