import { db } from "@/lib/server/db";
import { getSitemapSettings, getGlobalSeoSettings } from "./services/settings";
import type { ContentTypeKey } from "@/types/seo";

export interface SitemapUrlEntry {
  loc: string;
  lastModified: Date;
}

interface SitemapSource {
  contentType: ContentTypeKey;
  /** Count of eligible (published/active) rows, before per-row SEO exclusion. */
  count(): Promise<number>;
  /** Fetch one page of eligible rows (id, slug/path, updatedAt). */
  page(skip: number, take: number): Promise<{ id: string; path: string; updatedAt: Date }[]>;
}

const SOURCES: Record<string, SitemapSource> = {
  page: {
    contentType: "page",
    count: () => db.page.count({ where: { status: "PUBLISHED" } }),
    page: async (skip, take) => {
      const rows = await db.page.findMany({ where: { status: "PUBLISHED" }, skip, take, orderBy: { id: "asc" } });
      return rows.map((r) => ({ id: r.id, path: `/${r.slug}`, updatedAt: r.updatedAt }));
    },
  },
  post: {
    contentType: "post",
    count: () => db.blogPost.count({ where: { status: "PUBLISHED" } }),
    page: async (skip, take) => {
      const rows = await db.blogPost.findMany({ where: { status: "PUBLISHED" }, skip, take, orderBy: { id: "asc" } });
      return rows.map((r) => ({ id: r.id, path: `/blog/${r.slug}`, updatedAt: r.updatedAt }));
    },
  },
  product: {
    contentType: "product",
    count: () => db.product.count({ where: { status: "ACTIVE", visibility: "PUBLIC" } }),
    page: async (skip, take) => {
      const rows = await db.product.findMany({ where: { status: "ACTIVE", visibility: "PUBLIC" }, skip, take, orderBy: { id: "asc" } });
      return rows.map((r) => ({ id: r.id, path: `/shop/${r.slug}`, updatedAt: r.updatedAt }));
    },
  },
  category: {
    contentType: "category",
    count: () => db.blogCategory.count(),
    page: async (skip, take) => {
      const rows = await db.blogCategory.findMany({ skip, take, orderBy: { id: "asc" } });
      return rows.map((r) => ({ id: r.id, path: `/blog/category/${r.slug}`, updatedAt: new Date() }));
    },
  },
  collection: {
    contentType: "collection",
    count: () => db.collection.count(),
    page: async (skip, take) => {
      const rows = await db.collection.findMany({ skip, take, orderBy: { id: "asc" } });
      return rows.map((r) => ({ id: r.id, path: `/collections/${r.slug}`, updatedAt: new Date() }));
    },
  },
};

export function getSitemapSourceKeys(): string[] {
  return Object.keys(SOURCES);
}

export async function getSitemapSourceCount(key: string): Promise<number> {
  return SOURCES[key]?.count() ?? 0;
}

/**
 * Yields one chunk (page) of sitemap URL entries for a content type,
 * excluding anything explicitly marked noindex or sitemapInclude=false.
 * Never loads a full table into memory — bounded by `urlLimitPerFile`.
 */
export async function getSitemapChunk(key: string, chunkIndex: number): Promise<SitemapUrlEntry[]> {
  const source = SOURCES[key];
  if (!source) return [];

  const settings = await getSitemapSettings();
  const toggles = settings.contentTypeToggles ? JSON.parse(settings.contentTypeToggles) : {};
  if (toggles[key] === false) return [];

  const take = settings.urlLimitPerFile;
  const skip = chunkIndex * take;
  const rows = await source.page(skip, take);
  if (rows.length === 0) return [];

  const seoRecords = await db.seoMetadata.findMany({
    where: { entityType: source.contentType, entityId: { in: rows.map((r) => r.id) } },
    select: { entityId: true, sitemapInclude: true, robotsIndex: true },
  });
  const seoByEntity = new Map(seoRecords.map((r) => [r.entityId, r]));

  return rows
    .filter((row) => {
      const seo = seoByEntity.get(row.id);
      if (!seo) return true;
      return seo.sitemapInclude !== false && seo.robotsIndex !== false;
    })
    .map((row) => ({ loc: row.path, lastModified: row.updatedAt }));
}

export async function getSitemapChunkCount(key: string): Promise<number> {
  const settings = await getSitemapSettings();
  const total = await getSitemapSourceCount(key);
  return Math.max(1, Math.ceil(total / settings.urlLimitPerFile));
}

function urlEntryXml(entry: SitemapUrlEntry, siteUrl: string): string {
  return `  <url>\n    <loc>${siteUrl}${escapeXml(entry.loc)}</loc>\n    <lastmod>${entry.lastModified.toISOString()}</lastmod>\n  </url>`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function renderSitemapChunkXml(key: string, chunkIndex: number): Promise<string> {
  const [entries, globalSettings] = await Promise.all([getSitemapChunk(key, chunkIndex), getGlobalSeoSettings()]);
  const siteUrl = globalSettings.siteUrl.replace(/\/$/, "");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => urlEntryXml(e, siteUrl))
    .join("\n")}\n</urlset>\n`;
}

export async function renderSitemapIndexXml(): Promise<string> {
  const globalSettings = await getGlobalSeoSettings();
  const siteUrl = globalSettings.siteUrl.replace(/\/$/, "");
  const settings = await getSitemapSettings();
  const toggles = settings.contentTypeToggles ? JSON.parse(settings.contentTypeToggles) : {};

  const entries: string[] = [];
  for (const key of getSitemapSourceKeys()) {
    if (toggles[key] === false) continue;
    const chunkCount = await getSitemapChunkCount(key);
    for (let i = 0; i < chunkCount; i++) {
      entries.push(`  <sitemap>\n    <loc>${siteUrl}/sitemap-${key}-${i + 1}.xml</loc>\n  </sitemap>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</sitemapindex>\n`;
}
