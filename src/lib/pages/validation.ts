import { z } from "zod";
import { blockDocumentSchema } from "@/lib/pages/blocks/schema";

/**
 * Shared Zod validation for the Pages admin API routes — mirrors
 * src/lib/blog/validation.ts. Server-side validation is authoritative.
 */

export const PAGE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Slugs that already resolve to a real top-level route (static folders,
 * or the first segment of a nested one) and would never actually reach the
 * catch-all's Page lookup — creating a Page at one of these would be a
 * silently-dead page. Kept in sync with src/app/ 's top-level segments.
 */
export const RESERVED_PAGE_SLUGS = new Set([
  "admin",
  "api",
  "blog",
  "shop",
  "cart",
  "category",
  "collections",
  "robots.txt",
  "sitemap.xml",
]);

export const CONTENT_FORMATS = ["html", "blocks"] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export const pageInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(300),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(200)
      .regex(SLUG_RE, "Use lowercase letters, numbers, and hyphens only")
      .refine((slug) => !RESERVED_PAGE_SLUGS.has(slug), {
        message: "This slug is reserved by an existing site route and can't be used for a page.",
      }),
    content: z.string().optional().default(""),
    contentFormat: z.enum(CONTENT_FORMATS).optional().default("html"),
    blocks: blockDocumentSchema.optional(),
    status: z.enum(PAGE_STATUSES).optional().default("DRAFT"),
  })
  .refine((data) => data.contentFormat !== "blocks" || data.blocks !== undefined, {
    message: "Block content is required when using the block editor.",
    path: ["blocks"],
  });
export type PageInput = z.infer<typeof pageInputSchema>;
