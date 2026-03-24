import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, Clock3, Files, FolderGit2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { StudySidebar } from "@/components/study/study-sidebar";
import { normalizeMarkdownForDisplay } from "@/lib/markdown";
import { formatDate, siteName, absoluteUrl } from "@/lib/utils";
import { getStudyPageData } from "@/lib/study";

export const dynamic = "force-dynamic";

type StudyPageProps = {
  params: Promise<{ slug?: string[] }>;
};

function normalizeStudySlug(slug: string[]) {
  return slug.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
}

export async function generateMetadata({ params }: StudyPageProps): Promise<Metadata> {
  const { slug = [] } = await params;
  const normalizedSlug = normalizeStudySlug(slug);
  const { currentNote } = await getStudyPageData(normalizedSlug);

  const title = currentNote ? `${currentNote.label} | 学习笔记` : "学习笔记";
  const description = currentNote
    ? `来自 study 目录的学习笔记：${currentNote.label}`
    : "按目录浏览与阅读学习笔记。";
  const canonicalPath = normalizedSlug.length
    ? `/study/${normalizedSlug.map(encodeURIComponent).join("/")}`
    : "/study";

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${title} | ${siteName()}`,
      description,
      url: absoluteUrl(canonicalPath),
    },
  };
}

export default async function StudyPage({ params }: StudyPageProps) {
  const { slug = [] } = await params;
  const normalizedSlug = normalizeStudySlug(slug);
  const { tree, notes, currentNote } = await getStudyPageData(normalizedSlug);
  const normalizedContent =
    currentNote?.isMarkdown && currentNote.content ? normalizeMarkdownForDisplay(currentNote.content) : currentNote?.content;

  return (
    <div className="space-y-8">
      <section className="panel-surface overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-[var(--color-gold)]">Study Notes</p>
            <h1 className="mt-3 text-4xl text-[var(--color-cream)] sm:text-5xl">学习笔记</h1>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "笔记总数", value: notes.length, icon: Files },
              { label: "目录分组", value: tree.length, icon: FolderGit2 },
              { label: "当前模式", value: "双栏阅读", icon: BookOpenText },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.4rem] p-4"
                style={{ border: "1px solid var(--color-line)", background: "var(--color-panel-soft)" }}
              >
                <item.icon size={17} className="text-[var(--color-gold)]" />
                <p className="mt-4 text-xs text-[var(--color-muted)]">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-cream)]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <StudySidebar tree={tree} activeSlug={currentNote?.slugSegments ?? []} totalNotes={notes.length} />

        <section className="min-w-0 space-y-6">
          {currentNote ? (
            <>
              <div className="panel-surface rounded-[1.75rem] p-6">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
                  <Link href="/study" className="transition hover:text-[var(--color-foreground)]">
                    学习笔记
                  </Link>
                  {currentNote.displaySegments.map((segment, index) => (
                    <span key={`${segment}-${index}`} className="inline-flex items-center gap-3">
                      <span>/</span>
                      <span>{segment}</span>
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-gold)]">{currentNote.extension}</p>
                    <h2 className="mt-2 text-4xl text-[var(--color-cream)]">{currentNote.label}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                      style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)" }}
                    >
                      <Clock3 size={14} />
                      更新于 {formatDate(currentNote.updatedAt)}
                    </span>
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                      style={{ border: "1px solid var(--color-line)", background: "var(--button-ghost)" }}
                    >
                      <Files size={14} />
                      {currentNote.lineCount} 行
                    </span>
                  </div>
                </div>
              </div>

              <div className="panel-surface study-content rounded-[1.9rem] p-6 sm:p-8">
                {currentNote.isMarkdown ? (
                  <div className="article-prose study-markdown max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizedContent}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="article-prose study-code max-w-none">
                    <pre>
                      <code>{currentNote.content}</code>
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="panel-surface rounded-[1.9rem] p-8">
              <p className="text-sm uppercase tracking-[0.32em] text-[var(--color-gold)]">Study</p>
              <h2 className="mt-3 text-3xl text-[var(--color-cream)]">还没有可展示的笔记</h2>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

