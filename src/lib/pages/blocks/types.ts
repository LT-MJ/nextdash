/**
 * The block-based Page content model (a scoped, in-house Gutenberg
 * analogue). Framework-agnostic — no React import — because it's shared by
 * the editor's React block components AND the public string-based renderer
 * (src/lib/pages/blocks/render.ts), which runs inside a Route Handler that
 * can't import react-dom/server (see docs/pages.md).
 */

export type BlockAlign = "left" | "center" | "right";

export interface HeadingBlockData {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  align?: BlockAlign;
}

export interface ParagraphBlockData {
  text: string;
  align?: BlockAlign;
}

export interface ImageBlockData {
  src: string;
  alt: string;
  caption?: string;
  href?: string;
  align?: BlockAlign | "full";
}

export interface ButtonBlockData {
  text: string;
  href: string;
  style?: "primary" | "secondary" | "outline";
  align?: BlockAlign;
}

export interface ColumnsBlockData {
  columns: 2 | 3;
  items: Block[][];
}

export interface SpacerBlockData {
  height: number;
}

export type DividerBlockData = Record<string, never>;

export interface QuoteBlockData {
  text: string;
  citation?: string;
}

export interface CustomHtmlBlockData {
  html: string;
}

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "button"
  | "columns"
  | "spacer"
  | "divider"
  | "quote"
  | "customHtml";

export type Block =
  | { id: string; type: "heading"; data: HeadingBlockData }
  | { id: string; type: "paragraph"; data: ParagraphBlockData }
  | { id: string; type: "image"; data: ImageBlockData }
  | { id: string; type: "button"; data: ButtonBlockData }
  | { id: string; type: "columns"; data: ColumnsBlockData }
  | { id: string; type: "spacer"; data: SpacerBlockData }
  | { id: string; type: "divider"; data: DividerBlockData }
  | { id: string; type: "quote"; data: QuoteBlockData }
  | { id: string; type: "customHtml"; data: CustomHtmlBlockData };

export type BlockDocument = Block[];
