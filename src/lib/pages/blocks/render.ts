import { escapeHtml, escapeAttr } from "@/lib/html/escape";
import { isSafeUrl } from "./url-safety";
import type {
  Block,
  ButtonBlockData,
  ColumnsBlockData,
  HeadingBlockData,
  ImageBlockData,
  ParagraphBlockData,
  QuoteBlockData,
  SpacerBlockData,
  CustomHtmlBlockData,
} from "./types";

/**
 * Renders a validated block document to an HTML string. This is the public
 * rendering path — used from a Route Handler that can't render React (see
 * docs/pages.md) — so every text/URL field is escaped here, defense in
 * depth on top of the Zod validation already applied at save time. The one
 * deliberate exception is `customHtml`, which is the explicit trust
 * boundary (an authenticated `pages.edit` admin is already trusted with
 * raw HTML for a whole page today; this just scopes that trust to one
 * block instead of the entire page).
 */
export function renderBlocksToHtml(blocks: Block[]): string {
  return blocks.map(renderBlock).join("\n");
}

function renderBlock(block: Block): string {
  switch (block.type) {
    case "heading":
      return renderHeadingBlock(block.data);
    case "paragraph":
      return renderParagraphBlock(block.data);
    case "image":
      return renderImageBlock(block.data);
    case "button":
      return renderButtonBlock(block.data);
    case "columns":
      return renderColumnsBlock(block.data);
    case "spacer":
      return renderSpacerBlock(block.data);
    case "divider":
      return renderDividerBlock();
    case "quote":
      return renderQuoteBlock(block.data);
    case "customHtml":
      return renderCustomHtmlBlock(block.data);
    default:
      return "";
  }
}

function alignStyle(align: string | undefined): string {
  return align ? ` style="text-align:${align === "full" ? "left" : align}"` : "";
}

function safeHref(href: string): string {
  return isSafeUrl(href) ? escapeAttr(href) : "#";
}

export function renderHeadingBlock(data: HeadingBlockData): string {
  const level = Math.min(6, Math.max(1, data.level));
  return `<h${level}${alignStyle(data.align)}>${escapeHtml(data.text)}</h${level}>`;
}

export function renderParagraphBlock(data: ParagraphBlockData): string {
  return `<p${alignStyle(data.align)}>${escapeHtml(data.text)}</p>`;
}

export function renderImageBlock(data: ImageBlockData): string {
  const img = `<img src="${safeHref(data.src)}" alt="${escapeAttr(data.alt)}" />`;
  const wrapped = data.href ? `<a href="${safeHref(data.href)}">${img}</a>` : img;
  const caption = data.caption ? `<figcaption>${escapeHtml(data.caption)}</figcaption>` : "";
  const align = data.align && data.align !== "full" ? ` style="text-align:${data.align}"` : "";
  return `<figure${align}>${wrapped}${caption}</figure>`;
}

export function renderButtonBlock(data: ButtonBlockData): string {
  const style = data.style ?? "primary";
  return `<p${alignStyle(data.align)}><a class="blocks-button blocks-button--${style}" href="${safeHref(data.href)}">${escapeHtml(data.text)}</a></p>`;
}

export function renderColumnsBlock(data: ColumnsBlockData): string {
  const cols = data.items
    .slice(0, data.columns)
    .map((columnBlocks) => `<div>${renderBlocksToHtml(columnBlocks)}</div>`)
    .join("\n");
  return `<div class="blocks-columns" data-columns="${data.columns}">${cols}</div>`;
}

export function renderSpacerBlock(data: SpacerBlockData): string {
  const height = Math.min(200, Math.max(8, data.height));
  return `<div style="height:${height}px" aria-hidden="true"></div>`;
}

export function renderDividerBlock(): string {
  return `<hr class="blocks-divider" />`;
}

export function renderQuoteBlock(data: QuoteBlockData): string {
  const citation = data.citation ? `<footer>${escapeHtml(data.citation)}</footer>` : "";
  return `<blockquote class="blocks-quote"><p>${escapeHtml(data.text)}</p>${citation}</blockquote>`;
}

export function renderCustomHtmlBlock(data: CustomHtmlBlockData): string {
  return data.html;
}
