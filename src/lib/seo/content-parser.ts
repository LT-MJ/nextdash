import type { HeadingNode, ImageNode, LinkNode } from "@/types/seo";

/**
 * Lightweight, dependency-free HTML analysis for SEO rules. This is not a full
 * HTML parser — it is a pragmatic regex/state scan good enough to extract the
 * structural signals the analyzer needs (headings, images, links, paragraphs,
 * plain text) without pulling a DOM implementation into the server runtime.
 */

const TAG_RE = /<[^>]*>/g;
const HEADING_RE = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
const IMG_RE = /<img\b[^>]*>/gi;
const IMG_ATTR_RE = /(\w[\w-]*)\s*=\s*"([^"]*)"|(\w[\w-]*)\s*=\s*'([^']*)'/g;
const ANCHOR_RE = /<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
const PARAGRAPH_RE = /<p[^>]*>([\s\S]*?)<\/p>/gi;

function stripTags(html: string): string {
  return html
    .replace(TAG_RE, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function extractHeadings(html: string): HeadingNode[] {
  const headings: HeadingNode[] = [];
  for (const match of html.matchAll(HEADING_RE)) {
    const level = Number(match[1]) as HeadingNode["level"];
    const text = stripTags(match[2]);
    if (text) headings.push({ level, text });
  }
  return headings;
}

export function extractImages(html: string): ImageNode[] {
  const images: ImageNode[] = [];
  for (const tag of html.match(IMG_RE) ?? []) {
    let src = "";
    let alt: string | null = null;
    let hasAlt = false;
    for (const attrMatch of tag.matchAll(IMG_ATTR_RE)) {
      const name = (attrMatch[1] ?? attrMatch[3])?.toLowerCase();
      const value = attrMatch[2] ?? attrMatch[4] ?? "";
      if (name === "src") src = value;
      if (name === "alt") {
        hasAlt = true;
        alt = value;
      }
    }
    images.push({ src, alt: hasAlt ? alt : null });
  }
  return images;
}

export function extractLinks(html: string, siteHost?: string): LinkNode[] {
  const links: LinkNode[] = [];
  for (const match of html.matchAll(ANCHOR_RE)) {
    const href = match[1];
    const text = stripTags(match[2]);
    const internal = isInternalLink(href, siteHost);
    links.push({ href, text, internal });
  }
  return links;
}

export function isInternalLink(href: string, siteHost?: string): boolean {
  if (!href) return true;
  if (href.startsWith("/") || href.startsWith("#")) return true;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  try {
    const url = new URL(href);
    return siteHost ? url.host === siteHost : false;
  } catch {
    return true;
  }
}

export function extractParagraphs(html: string): string[] {
  const paragraphs: string[] = [];
  for (const match of html.matchAll(PARAGRAPH_RE)) {
    const text = stripTags(match[1]);
    if (text) paragraphs.push(text);
  }
  return paragraphs;
}

export function toPlainText(html: string): string {
  return stripTags(html);
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
