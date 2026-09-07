import { z } from "zod";

/** Server-side authoritative validation for Reading Settings and Header/Footer settings. */

export const HEADER_LAYOUTS = ["logo-left-nav-right", "centered", "logo-center-nav-below"] as const;
export type HeaderLayout = (typeof HEADER_LAYOUTS)[number];

export const readingSettingsInputSchema = z
  .object({
    homepageMode: z.enum(["DEFAULT", "PAGE"]).optional(),
    homepagePageId: z.string().trim().min(1).optional().nullable(),
    blogPageId: z.string().trim().min(1).optional().nullable(),
  })
  .refine((d) => d.homepageMode !== "PAGE" || !!d.homepagePageId, {
    message: "Select a page to use as the homepage.",
    path: ["homepagePageId"],
  });
export type ReadingSettingsInput = z.infer<typeof readingSettingsInputSchema>;

const footerLinkSchema = z.object({
  label: z.string().trim().min(1).max(150),
  url: z.string().trim().min(1).max(2000),
});

export const footerColumnSchema = z.object({
  heading: z.string().trim().min(1).max(100),
  menuId: z.string().trim().min(1).optional().nullable(),
  links: z.array(footerLinkSchema).max(20).optional().default([]),
});
export type FooterColumn = z.infer<typeof footerColumnSchema>;

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(50),
  url: z.string().trim().min(1).max(2000),
});
export type SocialLink = z.infer<typeof socialLinkSchema>;

export const headerFooterSettingsInputSchema = z.object({
  logoImageUrl: z.string().trim().max(2000).optional().nullable(),
  logoAltText: z.string().trim().max(200).optional().nullable(),
  logoText: z.string().trim().max(100).optional().nullable(),
  headerLayout: z.enum(HEADER_LAYOUTS).optional(),
  headerSticky: z.boolean().optional(),
  primaryMenuId: z.string().trim().min(1).optional().nullable(),
  footerColumns: z.array(footerColumnSchema).max(6).optional(),
  socialLinks: z.array(socialLinkSchema).max(10).optional(),
  copyrightText: z.string().trim().max(300).optional(),
});
export type HeaderFooterSettingsInput = z.infer<typeof headerFooterSettingsInputSchema>;
