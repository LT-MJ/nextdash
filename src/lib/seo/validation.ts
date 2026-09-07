import { z } from "zod";

/**
 * Shared SEO metadata validation — used both by the API route (server,
 * authoritative) and can be reused client-side for inline validation. Never
 * trust client-side validation alone (spec §70).
 */
export const seoMetadataInputSchema = z.object({
  title: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(320).optional().nullable(),
  focusKeyword: z.string().trim().max(100).optional().nullable(),
  additionalKeywords: z.array(z.string().trim().max(100)).max(20).optional(),

  canonicalUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  canonicalMode: z.enum(["AUTO", "CUSTOM"]).optional(),

  robotsIndex: z.boolean().optional(),
  robotsFollow: z.boolean().optional(),
  robotsNoarchive: z.boolean().optional(),
  robotsNosnippet: z.boolean().optional(),
  robotsNoimageindex: z.boolean().optional(),
  robotsMaxSnippet: z.number().int().min(-1).max(1000).optional().nullable(),
  robotsMaxImagePreview: z.enum(["none", "standard", "large"]).optional().nullable(),

  ogTitle: z.string().trim().max(160).optional().nullable(),
  ogDescription: z.string().trim().max(320).optional().nullable(),
  ogImage: z.string().trim().url().optional().nullable().or(z.literal("")),
  ogType: z.string().trim().max(50).optional().nullable(),

  twitterTitle: z.string().trim().max(160).optional().nullable(),
  twitterDescription: z.string().trim().max(320).optional().nullable(),
  twitterImage: z.string().trim().url().optional().nullable().or(z.literal("")),
  twitterCard: z.enum(["summary", "summary_large_image"]).optional().nullable(),

  schemaType: z.string().trim().max(50).optional().nullable(),
  schemaCustomJson: z.string().trim().max(20000).optional().nullable(),

  sitemapInclude: z.boolean().optional(),
  breadcrumbLabel: z.string().trim().max(100).optional().nullable(),
});

export type SeoMetadataInput = z.infer<typeof seoMetadataInputSchema>;

export const redirectInputSchema = z.object({
  source: z.string().trim().min(1).max(2000),
  destination: z.string().trim().min(1).max(2000),
  statusCode: z.union([z.literal(301), z.literal(302), z.literal(303), z.literal(307), z.literal(308)]),
  enabled: z.boolean().optional(),
  isRegex: z.boolean().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type RedirectInput = z.infer<typeof redirectInputSchema>;
