import { z } from "zod";

/**
 * Shared Zod validation for the Blog CMS admin API routes. Server-side
 * validation is authoritative — client forms may pre-validate but every
 * write also runs through these schemas (mirrors src/lib/seo/validation.ts).
 */

export const POST_STATUSES = ["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalUrl = z.string().trim().url().optional().nullable().or(z.literal(""));

export const postInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  slug: z.string().trim().min(1, "Slug is required").max(200).regex(SLUG_RE, "Use lowercase letters, numbers, and hyphens only"),
  excerpt: z.string().trim().max(500).optional().nullable(),
  content: z.string().optional().default(""),
  featuredImage: optionalUrl,
  gallery: z.array(z.string().trim().url()).max(50).optional().default([]),
  authorId: z.string().trim().min(1).optional().nullable(),
  categoryId: z.string().trim().min(1).optional().nullable(),
  tagIds: z.array(z.string().trim().min(1)).max(100).optional().default([]),
  status: z.enum(POST_STATUSES).optional().default("DRAFT"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional().default("PUBLIC"),
  publishedAt: z.string().trim().min(1).optional().nullable(),
  scheduledAt: z.string().trim().min(1).optional().nullable(),
  commentsEnabled: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
});
export type PostInput = z.infer<typeof postInputSchema>;

export const bulkStatusSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(500),
  status: z.enum(POST_STATUSES),
});
export type BulkStatusInput = z.infer<typeof bulkStatusSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: z.string().trim().min(1, "Slug is required").max(200).regex(SLUG_RE, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().max(2000).optional().nullable(),
  parentId: z.string().trim().min(1).optional().nullable(),
  featuredImage: optionalUrl,
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const tagInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: z.string().trim().min(1, "Slug is required").max(200).regex(SLUG_RE, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().max(1000).optional().nullable(),
});
export type TagInput = z.infer<typeof tagInputSchema>;

export const authorInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: z.string().trim().min(1, "Slug is required").max(200).regex(SLUG_RE, "Use lowercase letters, numbers, and hyphens only"),
  profileImage: optionalUrl,
  bio: z.string().trim().max(4000).optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  website: optionalUrl,
  socialProfiles: z.array(z.string().trim().url()).max(20).optional().default([]),
});
export type AuthorInput = z.infer<typeof authorInputSchema>;
