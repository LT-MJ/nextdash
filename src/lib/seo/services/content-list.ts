import { db } from "@/lib/server/db";
import type { ContentTypeKey } from "@/types/seo";

export interface ContentListItem {
  id: string;
  title: string;
  slug: string;
  updatedAt: Date;
}

type Lister = () => Promise<ContentListItem[]>;

export const CONTENT_LISTERS: Partial<Record<ContentTypeKey, Lister>> = {
  page: () => db.page.findMany({ orderBy: { updatedAt: "desc" }, take: 200 }),
  post: () => db.blogPost.findMany({ orderBy: { updatedAt: "desc" }, take: 200 }),
  product: async () => (await db.product.findMany({ orderBy: { updatedAt: "desc" }, take: 200 })).map((p) => ({ id: p.id, title: p.name, slug: p.slug, updatedAt: p.updatedAt })),
  category: async () => (await db.blogCategory.findMany({ take: 200 })).map((c) => ({ id: c.id, title: c.name, slug: c.slug, updatedAt: new Date() })),
  product_category: async () => (await db.productCategory.findMany({ take: 200 })).map((c) => ({ id: c.id, title: c.name, slug: c.slug, updatedAt: new Date() })),
  collection: async () => (await db.collection.findMany({ take: 200 })).map((c) => ({ id: c.id, title: c.name, slug: c.slug, updatedAt: new Date() })),
  author: async () => (await db.blogAuthor.findMany({ take: 200 })).map((a) => ({ id: a.id, title: a.name, slug: a.slug, updatedAt: new Date() })),
};

export interface ContentWithSeo extends ContentListItem {
  seoScore: number | null;
  seoGrade: string | null;
  hasTitle: boolean;
  hasDescription: boolean;
  robotsIndex: boolean;
}

export async function listContentWithSeo(entityType: ContentTypeKey): Promise<ContentWithSeo[]> {
  const lister = CONTENT_LISTERS[entityType];
  if (!lister) return [];
  const items = await lister();
  const seoRecords = await db.seoMetadata.findMany({ where: { entityType, entityId: { in: items.map((i) => i.id) } } });
  const seoByEntity = new Map(seoRecords.map((r) => [r.entityId, r]));

  return items.map((item) => {
    const seo = seoByEntity.get(item.id);
    return {
      ...item,
      seoScore: seo?.seoScore ?? null,
      seoGrade: seo?.seoGrade ?? null,
      hasTitle: Boolean(seo?.title),
      hasDescription: Boolean(seo?.description),
      robotsIndex: seo?.robotsIndex ?? true,
    };
  });
}
