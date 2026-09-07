import { z } from "zod";

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

export const pageInputSchema = z.object({
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
  status: z.enum(PAGE_STATUSES).optional().default("DRAFT"),
});
export type PageInput = z.infer<typeof pageInputSchema>;
