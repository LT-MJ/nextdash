import { z } from "zod";
import { isSafeUrl } from "./url-safety";
import type { Block } from "./types";

/**
 * Server-side authoritative validation for block documents, mirroring the
 * shape of src/lib/pages/blocks/types.ts. `columns` is the one recursive
 * case, handled with z.lazy().
 */

const align = z.enum(["left", "center", "right"]).optional();
const safeUrl = (max = 2000) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine(isSafeUrl, { message: "This URL scheme isn't allowed." });

const headingSchema = z.object({
  id: z.string(),
  type: z.literal("heading"),
  data: z.object({
    level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
    text: z.string().max(300),
    align,
  }),
});

const paragraphSchema = z.object({
  id: z.string(),
  type: z.literal("paragraph"),
  data: z.object({ text: z.string().max(10000), align }),
});

const imageSchema = z.object({
  id: z.string(),
  type: z.literal("image"),
  data: z.object({
    src: safeUrl(),
    alt: z.string().max(300),
    caption: z.string().max(500).optional(),
    href: safeUrl().optional(),
    align: z.enum(["left", "center", "right", "full"]).optional(),
  }),
});

const buttonSchema = z.object({
  id: z.string(),
  type: z.literal("button"),
  data: z.object({
    text: z.string().min(1).max(100),
    href: safeUrl(),
    style: z.enum(["primary", "secondary", "outline"]).optional(),
    align,
  }),
});

const spacerSchema = z.object({
  id: z.string(),
  type: z.literal("spacer"),
  data: z.object({ height: z.number().int().min(8).max(200) }),
});

const dividerSchema = z.object({
  id: z.string(),
  type: z.literal("divider"),
  data: z.object({}),
});

const quoteSchema = z.object({
  id: z.string(),
  type: z.literal("quote"),
  data: z.object({ text: z.string().max(2000), citation: z.string().max(200).optional() }),
});

const customHtmlSchema = z.object({
  id: z.string(),
  type: z.literal("customHtml"),
  data: z.object({ html: z.string().max(50000) }),
});

// `columns` may only nest the non-columns block types (enforced structurally
// here, so a superRefine walk isn't needed to catch columns-in-columns).
const nonColumnsBlockSchema = z.discriminatedUnion("type", [
  headingSchema,
  paragraphSchema,
  imageSchema,
  buttonSchema,
  spacerSchema,
  dividerSchema,
  quoteSchema,
  customHtmlSchema,
]);

const columnsSchema = z.object({
  id: z.string(),
  type: z.literal("columns"),
  data: z.object({
    columns: z.union([z.literal(2), z.literal(3)]),
    items: z.array(z.array(nonColumnsBlockSchema).max(50)).max(3),
  }),
});

export const blockSchema = z.discriminatedUnion("type", [
  headingSchema,
  paragraphSchema,
  imageSchema,
  buttonSchema,
  columnsSchema,
  spacerSchema,
  dividerSchema,
  quoteSchema,
  customHtmlSchema,
]);

export const blockDocumentSchema = z.array(blockSchema).max(300);

/** Parses a stored `Page.blocks` JSON string, defaulting to [] on any failure. */
export function parseBlocks(raw: string | null | undefined): Block[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const result = blockDocumentSchema.safeParse(parsed);
    if (!result.success) {
      console.error("parseBlocks: stored block document failed validation", result.error.flatten());
      return [];
    }
    return result.data;
  } catch (err) {
    console.error("parseBlocks: stored block document is not valid JSON", err);
    return [];
  }
}
