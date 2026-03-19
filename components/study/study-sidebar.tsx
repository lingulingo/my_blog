import type { ReactNode } from "react";
import Link from "next/link";
import { BookMarked, ChevronRight, FileCode2, FolderTree } from "lucide-react";

import { type StudyNode } from "@/lib/study";
import { cn } from "@/lib/utils";

type StudySidebarProps = {
  tree: StudyNode[];
  activeSlug: string[];
  totalNotes: number;
};

function countNotes(nodes: StudyNode[]): number {
  return nodes.reduce((total, node) => {
    if (node.type === "file") {
      return total + 1;
    }
    return total + countNotes(node.children);
  }, 0);
}

function isActivePath(activeSlug: string[], slugSegments: string[]) {
  return slugSegments.every((segment, index) => activeSlug[index] === segment);
}

function renderNodes(nodes: StudyNode[], activeSlug: string[], depth = 0): ReactNode {
  return nodes.map((node) => {
    if (node.type === "directory") {
      const open = depth < 1 || isActivePath(activeSlug, node.slugSegments);

      return (
        <details key={node.slugSegments.join("/")} open={open} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2 text-sm text-[var(--color-foreground)] transition hover:bg-[var(--button-ghost)]">
            <span className="flex items-center gap-2">
              <FolderTree size={15} className="text-[var(--color-gold)]" />
              <span>{node.label}</span>
            </span>
            <span className="flex items-center gap-2 text-[11px] text-[var(--color-muted)]">
              {countNotes(node.children)}
              <ChevronRight size={14} className="transition group-open:rotate-90" />
            </span>
          </summary>
          <div className="mt-1 space-y-1 border-l pl-3" style={{ borderColor: "var(--color-line)", marginLeft: "0.9rem" }}>
            {renderNodes(node.children, activeSlug, depth + 1)}
          </div>
        </details>
      );
    }

    const href = `/study/${node.slugSegments.map(encodeURIComponent).join("/")}`;
    const active = node.slugSegments.join("/") === activeSlug.join("/");

    return (
      <Link
        key={node.slugSegments.join("/")}
        href={href}
        className={cn(
          "block rounded-xl px-3 py-2 text-sm transition",
          active
            ? "text-[var(--color-foreground)]"
            : "text-[var(--color-muted)] hover:bg-[var(--button-ghost)] hover:text-[var(--color-foreground)]",
        )}
        style={
          active
            ? {
                background: "linear-gradient(135deg, rgba(212,177,106,0.18), rgba(255,255,255,0.06))",
                border: "1px solid rgba(212,177,106,0.2)",
              }
            : undefined
        }
      >
        <span className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <FileCode2 size={14} className="shrink-0 text-[var(--color-gold)]" />
            <span className="truncate">{node.label}</span>
          </span>
          <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {node.extension}
          </span>
        </span>
      </Link>
    );
  });
}

export function StudySidebar({ tree, activeSlug, totalNotes }: StudySidebarProps) {
  return (
    <aside className="panel-surface rounded-[1.75rem] p-4 lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">Study</p>
          <h2 className="mt-2 text-2xl text-[var(--color-cream)]">笔记目录</h2>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs text-[var(--color-muted)]"
          style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)" }}
        >
          {totalNotes} 篇
        </div>
      </div>

      <div
        className="mt-4 rounded-[1.2rem] p-3 text-sm text-[var(--color-muted)]"
        style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}
      >
        <p className="flex items-center gap-2 text-[var(--color-foreground)]">
          <BookMarked size={15} className="text-[var(--color-gold)]" />
          基于 study 目录自动生成
        </p>
        <p className="mt-2 leading-7">左侧按文件夹组织目录，右侧展示笔记正文，后续你往目录里继续写就可以了。</p>
      </div>

      <div className="mt-5 max-h-[70vh] space-y-1 overflow-y-auto pr-1">{renderNodes(tree, activeSlug)}</div>
    </aside>
  );
}

