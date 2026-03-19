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
};

export type StudyDirectoryNode = {
  type: "directory";
  name: string;
  label: string;
  slugSegments: string[];
  children: StudyNode[];
};

export type StudyNode = StudyFileNode | StudyDirectoryNode;

export type StudyNoteDetail = StudyFileNode & {
  content: string;
  updatedAt: Date;
  lineCount: number;
  isMarkdown: boolean;
};

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
      slugSegments: [...parentSegments, basename],
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

export async function getStudyTree() {
  try {
    return await buildTree(STUDY_ROOT);
  } catch {
    return [];
  }
}

export async function getStudyNotes() {
  const tree = await getStudyTree();
  return flattenNotes(tree);
}

export async function getStudyNoteDetail(slugSegments?: string[]) {
  const notes = await getStudyNotes();
  const selected =
    slugSegments && slugSegments.length > 0
      ? notes.find((note) => note.slugSegments.join("/") === slugSegments.join("/"))
      : notes[0];

  if (!selected) {
    return null;
  }

  const absolutePath = path.join(STUDY_ROOT, selected.relativePath);
  const [content, stats] = await Promise.all([fs.readFile(absolutePath, "utf8"), fs.stat(absolutePath)]);

  return {
    ...selected,
    content,
    updatedAt: stats.mtime,
    lineCount: content.split(/\r?\n/).length,
    isMarkdown: ["md", "markdown"].includes(selected.extension),
  } satisfies StudyNoteDetail;
}

export async function getStudyPageData(slugSegments?: string[]) {
  const tree = await getStudyTree();
  const notes = flattenNotes(tree);
  const currentNote =
    slugSegments && slugSegments.length > 0
      ? notes.find((note) => note.slugSegments.join("/") === slugSegments.join("/"))
      : notes[0];

  if (!currentNote) {
    return {
      tree,
      notes,
      currentNote: null,
    };
  }

  const absolutePath = path.join(STUDY_ROOT, currentNote.relativePath);
  const [content, stats] = await Promise.all([fs.readFile(absolutePath, "utf8"), fs.stat(absolutePath)]);

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

