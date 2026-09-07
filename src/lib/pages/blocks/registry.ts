import type { Block, BlockType } from "./types";

/**
 * Editor-facing metadata for each block type — labels, grouping, and
 * default data. This is the single source the block inserter UI and the
 * per-type editor components key off of; the Zod schema (schema.ts) and the
 * string renderer (render.ts) are separate representations that must stay
 * consistent with this list, but are not derived from it automatically.
 */
export interface BlockRegistryEntry {
  type: BlockType;
  label: string;
  group: "Text" | "Media" | "Layout" | "Advanced";
  defaultData: () => Block["data"];
}

function newId(): string {
  return crypto.randomUUID();
}

export const BLOCK_REGISTRY: BlockRegistryEntry[] = [
  { type: "heading", label: "Heading", group: "Text", defaultData: () => ({ level: 2, text: "" }) },
  { type: "paragraph", label: "Paragraph", group: "Text", defaultData: () => ({ text: "" }) },
  { type: "quote", label: "Quote", group: "Text", defaultData: () => ({ text: "" }) },
  { type: "image", label: "Image", group: "Media", defaultData: () => ({ src: "", alt: "" }) },
  { type: "button", label: "Button", group: "Layout", defaultData: () => ({ text: "Learn more", href: "" }) },
  { type: "columns", label: "Columns", group: "Layout", defaultData: () => ({ columns: 2, items: [[], []] }) },
  { type: "spacer", label: "Spacer", group: "Layout", defaultData: () => ({ height: 40 }) },
  { type: "divider", label: "Divider", group: "Layout", defaultData: () => ({}) },
  { type: "customHtml", label: "Custom HTML", group: "Advanced", defaultData: () => ({ html: "" }) },
];

export function getBlockRegistryEntry(type: BlockType): BlockRegistryEntry {
  const entry = BLOCK_REGISTRY.find((b) => b.type === type);
  if (!entry) throw new Error(`Unknown block type: ${type}`);
  return entry;
}

export function createBlock(type: BlockType): Block {
  const entry = getBlockRegistryEntry(type);
  return { id: newId(), type, data: entry.defaultData() } as Block;
}
