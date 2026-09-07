import crypto from "node:crypto";
import { db } from "@/lib/server/db";
import { getContentAdapter } from "../content-registry";
import { analyzeSeo } from "../scoring";
import { getSeoRuleConfigs, getGlobalSeoSettings } from "./settings";
import type { ContentTypeKey, SeoAnalysisInput } from "@/types/seo";
import type { SeoMetadataInput } from "../validation";
import { toPlainText } from "../content-parser";

function computeContentHash(input: { title: string | null; description: string | null; focusKeyword: string | null; contentHtml: string; slug: string }) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
}

export async function buildAnalysisInput(entityType: ContentTypeKey, entityId: string) {
  const adapter = getContentAdapter(entityType);
  if (!adapter) throw new Error(`No SEO content adapter registered for entityType "${entityType}"`);

  const [contentHtml, slug, path, seoMetadata] = await Promise.all([
    adapter.getContentHtml(entityId),
    adapter.getSlug(entityId),
    adapter.buildPath(entityId),
    db.seoMetadata.findUnique({ where: { entityType_entityId: { entityType, entityId } } }),
  ]);

  const analysisInput: SeoAnalysisInput = {
    entityType,
    entityId,
    url: path ?? "",
    slug: slug ?? "",
    seoTitle: seoMetadata?.title ?? null,
    metaDescription: seoMetadata?.description ?? null,
    focusKeyword: seoMetadata?.focusKeyword ?? null,
    additionalKeywords: seoMetadata?.additionalKeywords ? JSON.parse(seoMetadata.additionalKeywords) : [],
    contentHtml,
    robotsIndex: seoMetadata?.robotsIndex ?? true,
    canonicalUrl: seoMetadata?.canonicalUrl ?? path,
    schemaType: seoMetadata?.schemaType ?? null,
    hasCustomSchema: Boolean(seoMetadata?.schemaCustomJson),
    sitemapInclude: seoMetadata?.sitemapInclude ?? true,
  };

  return { analysisInput, seoMetadata, path, contentHtml };
}

export async function analyzeContentSeo(entityType: ContentTypeKey, entityId: string) {
  const { analysisInput } = await buildAnalysisInput(entityType, entityId);
  const ruleConfigs = await getSeoRuleConfigs();
  const overrides = ruleConfigs.map((rule) => ({
    key: rule.key,
    enabled: rule.enabled,
    weight: rule.weight,
  }));
  return analyzeSeo(analysisInput, { overrides });
}

export interface SeoEditorData {
  entityType: ContentTypeKey;
  entityId: string;
  title: string | null;
  path: string | null;
  slug: string | null;
  seoMetadata: Record<string, unknown> | null;
  analysis: Awaited<ReturnType<typeof analyzeSeo>>;
  siteUrl: string;
}

export async function getSeoEditorData(entityType: ContentTypeKey, entityId: string): Promise<SeoEditorData> {
  const adapter = getContentAdapter(entityType);
  if (!adapter) throw new Error(`No SEO content adapter registered for entityType "${entityType}"`);
  if (!(await adapter.exists(entityId))) throw new Error("NOT_FOUND");

  const [{ analysisInput, seoMetadata, path }, title, globalSettings, ruleConfigs] = await Promise.all([
    buildAnalysisInput(entityType, entityId),
    adapter.getTitle(entityId),
    getGlobalSeoSettings(),
    getSeoRuleConfigs(),
  ]);

  const overrides = ruleConfigs.map((rule) => ({ key: rule.key, enabled: rule.enabled, weight: rule.weight }));
  const analysis = analyzeSeo(analysisInput, { overrides });

  return {
    entityType,
    entityId,
    title,
    path,
    slug: analysisInput.slug,
    seoMetadata: seoMetadata
      ? {
          ...seoMetadata,
          additionalKeywords: seoMetadata.additionalKeywords ? JSON.parse(seoMetadata.additionalKeywords) : [],
        }
      : null,
    analysis,
    siteUrl: globalSettings.siteUrl,
  };
}

export async function saveSeoMetadata(
  entityType: ContentTypeKey,
  entityId: string,
  input: SeoMetadataInput,
  actorUserId?: string
) {
  const adapter = getContentAdapter(entityType);
  if (!adapter) throw new Error(`No SEO content adapter registered for entityType "${entityType}"`);
  if (!(await adapter.exists(entityId))) throw new Error("NOT_FOUND");

  const existing = await db.seoMetadata.findUnique({ where: { entityType_entityId: { entityType, entityId } } });

  const data = {
    title: input.title || null,
    description: input.description || null,
    focusKeyword: input.focusKeyword || null,
    additionalKeywords: input.additionalKeywords ? JSON.stringify(input.additionalKeywords) : null,
    canonicalUrl: input.canonicalUrl || null,
    canonicalMode: input.canonicalMode ?? "AUTO",
    robotsIndex: input.robotsIndex ?? true,
    robotsFollow: input.robotsFollow ?? true,
    robotsNoarchive: input.robotsNoarchive ?? false,
    robotsNosnippet: input.robotsNosnippet ?? false,
    robotsNoimageindex: input.robotsNoimageindex ?? false,
    robotsMaxSnippet: input.robotsMaxSnippet ?? null,
    robotsMaxImagePreview: input.robotsMaxImagePreview ?? null,
    ogTitle: input.ogTitle || null,
    ogDescription: input.ogDescription || null,
    ogImage: input.ogImage || null,
    ogType: input.ogType || null,
    twitterTitle: input.twitterTitle || null,
    twitterDescription: input.twitterDescription || null,
    twitterImage: input.twitterImage || null,
    twitterCard: input.twitterCard || "summary_large_image",
    schemaType: input.schemaType || null,
    schemaCustomJson: input.schemaCustomJson || null,
    sitemapInclude: input.sitemapInclude ?? true,
    breadcrumbLabel: input.breadcrumbLabel || null,
  };

  const [contentHtml, slug] = await Promise.all([adapter.getContentHtml(entityId), adapter.getSlug(entityId)]);
  const contentHash = computeContentHash({
    title: data.title,
    description: data.description,
    focusKeyword: data.focusKeyword,
    contentHtml,
    slug: slug ?? "",
  });

  const saved = await db.seoMetadata.upsert({
    where: { entityType_entityId: { entityType, entityId } },
    update: { ...data, contentHash, analyzedAt: new Date() },
    create: { entityType, entityId, ...data, contentHash, analyzedAt: new Date() },
  });

  const analysis = await analyzeContentSeo(entityType, entityId);
  await db.seoMetadata.update({
    where: { id: saved.id },
    data: {
      seoScore: analysis.score,
      seoGrade: analysis.grade,
      seoScoreBreakdown: JSON.stringify(analysis.results),
    },
  });

  await db.activityLog.create({
    data: {
      userId: actorUserId,
      action: existing ? "seo.update" : "seo.create",
      entityType,
      entityId,
      oldValue: existing ? JSON.stringify(existing) : null,
      newValue: JSON.stringify(data),
    },
  });

  return { ...saved, seoScore: analysis.score, seoGrade: analysis.grade };
}

export interface BulkSeoFlagChanges {
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  sitemapInclude?: boolean;
}

/**
 * Bulk-apply safe, non-destructive SEO flags (index/follow/sitemap
 * inclusion) across many entities of one content type at once. Deliberately
 * does not support bulk title/description overwrites — spec §46/§88 warns
 * against silently overwriting per-item content in bulk; those still go
 * through the per-item editor or CSV import with a dry-run.
 */
export async function bulkUpdateSeoFlags(
  entityType: ContentTypeKey,
  entityIds: string[],
  changes: BulkSeoFlagChanges,
  actorUserId?: string
): Promise<number> {
  let updated = 0;
  for (const entityId of entityIds) {
    const existing = await db.seoMetadata.findUnique({ where: { entityType_entityId: { entityType, entityId } } });
    await db.seoMetadata.upsert({
      where: { entityType_entityId: { entityType, entityId } },
      update: changes,
      create: { entityType, entityId, robotsIndex: true, robotsFollow: true, sitemapInclude: true, ...changes },
    });
    updated += 1;
    await db.activityLog.create({
      data: {
        userId: actorUserId,
        action: "seo.bulk_update",
        entityType,
        entityId,
        oldValue: existing ? JSON.stringify(existing) : null,
        newValue: JSON.stringify(changes),
      },
    });
  }
  return updated;
}

export async function getEntityTitleForContentType(entityType: ContentTypeKey, entityId: string): Promise<string | null> {
  const adapter = getContentAdapter(entityType);
  if (!adapter) return null;
  return adapter.getTitle(entityId);
}

export function stripToExcerpt(html: string, maxLength = 160): string {
  const text = toPlainText(html);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}
