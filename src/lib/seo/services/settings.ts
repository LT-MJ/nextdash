import { cache } from "react";
import { db } from "@/lib/server/db";
import type { ContentTypeKey } from "@/types/seo";

/**
 * Centralized SEO settings accessors (spec §51). Components and route
 * handlers should always go through these functions rather than querying
 * SeoGlobalSettings / SeoContentTypeSettings / etc. directly, so caching and
 * defaulting behavior stays in one place.
 */

export const getGlobalSeoSettings = cache(async () => {
  const settings = await db.seoGlobalSettings.findUnique({ where: { id: "default" } });
  if (settings) return settings;
  return db.seoGlobalSettings.create({ data: { id: "default" } });
});

export const getContentTypeSettings = cache(async (contentType: ContentTypeKey) => {
  const settings = await db.seoContentTypeSettings.findUnique({ where: { contentType } });
  if (settings) return settings;
  return {
    id: contentType,
    contentType,
    label: contentType,
    titleTemplate: null,
    descriptionTemplate: null,
    robotsIndexDefault: true,
    robotsFollowDefault: true,
    schemaTypeDefault: null,
    sitemapEnabled: true,
    seoEditorVisible: true,
  };
});

export const getAllContentTypeSettings = cache(async () => {
  return db.seoContentTypeSettings.findMany({ orderBy: { contentType: "asc" } });
});

export const getSitemapSettings = cache(async () => {
  const settings = await db.sitemapSettings.findUnique({ where: { id: "default" } });
  if (settings) return settings;
  return db.sitemapSettings.create({ data: { id: "default" } });
});

export const getRobotsTxtSettings = cache(async () => {
  const settings = await db.robotsTxtSettings.findUnique({ where: { id: "default" } });
  if (settings) return settings;
  return db.robotsTxtSettings.create({ data: { id: "default" } });
});

export const getBreadcrumbSettings = cache(async () => {
  const settings = await db.breadcrumbSettings.findUnique({ where: { id: "default" } });
  if (settings) return settings;
  return db.breadcrumbSettings.create({ data: { id: "default" } });
});

export const getLocalSeoSettings = cache(async () => {
  const settings = await db.localSeoSettings.findUnique({ where: { id: "default" } });
  if (settings) return settings;
  return db.localSeoSettings.create({ data: { id: "default" } });
});

export const getSeoRuleConfigs = cache(async () => {
  return db.seoRuleConfig.findMany();
});

export async function updateGlobalSeoSettings(data: Partial<Awaited<ReturnType<typeof getGlobalSeoSettings>>>) {
  return db.seoGlobalSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
}

export async function updateContentTypeSettings(contentType: ContentTypeKey, data: Record<string, unknown>) {
  return db.seoContentTypeSettings.upsert({
    where: { contentType },
    update: data,
    create: { contentType, label: contentType, ...data },
  });
}

export async function updateSitemapSettings(data: Record<string, unknown>) {
  return db.sitemapSettings.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
}

export async function updateRobotsTxtSettings(content: string) {
  return db.robotsTxtSettings.upsert({
    where: { id: "default" },
    update: { content },
    create: { id: "default", content },
  });
}

export async function updateBreadcrumbSettings(data: Record<string, unknown>) {
  return db.breadcrumbSettings.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
}

export async function updateLocalSeoSettings(data: Record<string, unknown>) {
  return db.localSeoSettings.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
}
