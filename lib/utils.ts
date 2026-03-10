import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import slugify from "slugify";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(value: Date | string) {
  return format(new Date(value), "yyyy-MM-dd");
}

export function makeSlug(title: string) {
  return slugify(title, { lower: true, strict: true, trim: true }) || `post-${Date.now()}`;
}

export function tagList(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function excerptFromHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function excerptFromMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|- |\* |\d+\. )/gm, "")
    .replace(/[*_~>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export function siteName() {
  return process.env.SITE_NAME || "灵寒谷的blog";
}

export function siteUrl() {
  return process.env.SITE_URL || "http://localhost:3000";
}

export function absoluteUrl(path = "") {
  return `${siteUrl().replace(/\/$/, "")}${path}`;
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getHeatScore(metrics: { visits: number; reactions: number; comments?: number }) {
  return metrics.visits * 3 + metrics.reactions * 2 + (metrics.comments ?? 0);
}
