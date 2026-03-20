"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, FileCode2, FolderTree, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { type StudyNode } from "@/lib/study";
import { cn } from "@/lib/utils";

type StudySidebarProps = {
  tree: StudyNode[];
  activeSlug: string[];
  totalNotes: number;
};

const STUDY_SIDEBAR_STORAGE_KEY = "study-sidebar-open-paths";

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

function getAncestorPaths(slugSegments: string[]) {
  return slugSegments.slice(0, -1).map((_, index) => slugSegments.slice(0, index + 1).join("/"));
}

function getAllDirectoryPaths(nodes: StudyNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type === "directory") {
      return [node.slugSegments.join("/"), ...getAllDirectoryPaths(node.children)];
    }
    return [];
  });
}

type RenderTreeOptions = {
  activeSlug: string[];
  openPaths: Record<string, boolean>;
  depth?: number;
  onToggle: (path: string) => void;
  activeLinkRef: React.RefObject<HTMLAnchorElement | null>;
};

function renderNodes(nodes: StudyNode[], options: RenderTreeOptions): React.ReactNode {
  const { activeSlug, openPaths, onToggle, activeLinkRef, depth = 0 } = options;

  return nodes.map((node) => {
    const pathKey = node.slugSegments.join("/");

    if (node.type === "directory") {
      const isCurrentBranch = isActivePath(activeSlug, node.slugSegments);
      const open = Boolean(openPaths[pathKey]);

      return (
        <div key={pathKey} className="space-y-1">
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl px-2 py-1.5 transition",
              isCurrentBranch ? "bg-[var(--button-ghost)]/70" : "",
            )}
          >
            <button
              type="button"
              onClick={() => onToggle(pathKey)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-[var(--button-ghost)]"
              style={{ color: open ? "var(--color-foreground)" : "var(--color-muted)" }}
              aria-label={open ? `收起 ${node.label}` : `展开 ${node.label}`}
            >
              <ChevronRight size={15} className={cn("transition duration-200", open ? "rotate-90" : "")} />
            </button>

            <button
              type="button"
              onClick={() => onToggle(pathKey)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition hover:bg-[var(--button-ghost)]"
            >
              <FolderTree size={15} className="shrink-0 text-[var(--color-gold)]" />
              <span className="truncate text-[var(--color-foreground)]">{node.label}</span>
              <span
                className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] text-[var(--color-muted)]"
                style={{ border: "1px solid var(--color-line)", background: "rgba(255,255,255,0.03)" }}
              >
                {countNotes(node.children)}
              </span>
            </button>
          </div>

          {open ? (
            <div className="space-y-1 border-l pl-3" style={{ borderColor: "var(--color-line)", marginLeft: "1rem" }}>
              {renderNodes(node.children, {
                activeSlug,
                openPaths,
                onToggle,
                activeLinkRef,
                depth: depth + 1,
              })}
            </div>
          ) : null}
        </div>
      );
    }

    const href = `/study/${node.slugSegments.map(encodeURIComponent).join("/")}`;
    const active = pathKey === activeSlug.join("/");

    return (
      <Link
        key={pathKey}
        href={href}
        ref={active ? activeLinkRef : undefined}
        className={cn(
          "group block rounded-2xl px-3 py-2.5 text-sm transition",
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
          <span className="flex min-w-0 items-center gap-2.5">
            <FileCode2
              size={14}
              className={cn(
                "shrink-0 transition",
                active ? "text-[var(--color-gold)]" : "text-[var(--color-gold)]/80 group-hover:text-[var(--color-gold)]",
              )}
            />
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
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const [openPaths, setOpenPaths] = useState<Record<string, boolean>>({});

  const ancestorPaths = useMemo(() => getAncestorPaths(activeSlug), [activeSlug]);
  const directoryPaths = useMemo(() => getAllDirectoryPaths(tree), [tree]);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STUDY_SIDEBAR_STORAGE_KEY)
        : null;

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        const nextState = Object.fromEntries(
          directoryPaths.map((path) => [path, parsed.includes(path)]),
        );
        setOpenPaths(nextState);
        return;
      } catch {
        // noop
      }
    }

    const defaultOpen = Object.fromEntries(
      directoryPaths.map((path) => [path, ancestorPaths.includes(path) || path.split("/").length === 1]),
    );
    setOpenPaths(defaultOpen);
  }, [ancestorPaths, directoryPaths]);

  useEffect(() => {
    if (!activeLinkRef.current) {
      return;
    }

    activeLinkRef.current.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeSlug]);

  const persistOpenPaths = (nextState: Record<string, boolean>) => {
    setOpenPaths(nextState);
    const opened = Object.entries(nextState)
      .filter(([, isOpen]) => isOpen)
      .map(([path]) => path);
    window.localStorage.setItem(STUDY_SIDEBAR_STORAGE_KEY, JSON.stringify(opened));
  };

  const togglePath = (path: string) => {
    persistOpenPaths({
      ...openPaths,
      [path]: !openPaths[path],
    });
  };

  const collapseAll = () => {
    persistOpenPaths(Object.fromEntries(directoryPaths.map((path) => [path, false])));
  };

  const expandCurrent = () => {
    persistOpenPaths(
      Object.fromEntries(
        directoryPaths.map((path) => [path, ancestorPaths.includes(path) || path.split("/").length === 1]),
      ),
    );
  };

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

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={expandCurrent}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
          style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)" }}
        >
          <PanelLeftOpen size={13} />
          当前目录
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
          style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)" }}
        >
          <PanelLeftClose size={13} />
          全部收起
        </button>
      </div>

      <div className="mt-5 max-h-[78vh] space-y-1 overflow-y-auto pr-1">
        {renderNodes(tree, {
          activeSlug,
          openPaths,
          onToggle: togglePath,
          activeLinkRef,
        })}
      </div>
    </aside>
  );
}

