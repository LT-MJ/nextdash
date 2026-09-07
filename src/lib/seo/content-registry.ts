import { db } from "@/lib/server/db";
import { parseBlocks } from "@/lib/pages/blocks/schema";
import { renderBlocksToHtml } from "@/lib/pages/blocks/render";
import type { ContentTypeKey } from "@/types/seo";

/**
 * Lets the generic SEO editor/analyzer work against any entity type without
 * hardcoding per-type logic at every call site (spec §83 "registerSEOContentType").
 * Add an adapter here when a new SEO-enabled content type is introduced.
 */
export interface SeoContentAdapter {
  entityType: ContentTypeKey;
  label: string;
  /** Absolute site path used for canonical URL + preview, e.g. "/blog/my-post". */
  buildPath(entityId: string): Promise<string | null>;
  getTitle(entityId: string): Promise<string | null>;
  getSlug(entityId: string): Promise<string | null>;
  /** Raw HTML/plain-text body used for content analysis rules. */
  getContentHtml(entityId: string): Promise<string>;
  exists(entityId: string): Promise<boolean>;
}

const adapters = new Map<ContentTypeKey, SeoContentAdapter>();

export function registerContentAdapter(adapter: SeoContentAdapter): void {
  adapters.set(adapter.entityType, adapter);
}

export function getContentAdapter(entityType: ContentTypeKey): SeoContentAdapter | undefined {
  return adapters.get(entityType);
}

export function getAllContentAdapters(): SeoContentAdapter[] {
  return [...adapters.values()];
}

registerContentAdapter({
  entityType: "page",
  label: "Pages",
  async buildPath(entityId) {
    const page = await db.page.findUnique({ where: { id: entityId }, select: { slug: true } });
    return page ? `/${page.slug}` : null;
  },
  async getTitle(entityId) {
    return (await db.page.findUnique({ where: { id: entityId }, select: { title: true } }))?.title ?? null;
  },
  async getSlug(entityId) {
    return (await db.page.findUnique({ where: { id: entityId }, select: { slug: true } }))?.slug ?? null;
  },
  async getContentHtml(entityId) {
    const page = await db.page.findUnique({ where: { id: entityId }, select: { content: true, contentFormat: true, blocks: true } });
    if (!page) return "";
    return page.contentFormat === "blocks" ? renderBlocksToHtml(parseBlocks(page.blocks)) : page.content;
  },
  async exists(entityId) {
    return (await db.page.count({ where: { id: entityId } })) > 0;
  },
});

registerContentAdapter({
  entityType: "post",
  label: "Blog Posts",
  async buildPath(entityId) {
    const post = await db.blogPost.findUnique({ where: { id: entityId }, select: { slug: true } });
    return post ? `/blog/${post.slug}` : null;
  },
  async getTitle(entityId) {
    return (await db.blogPost.findUnique({ where: { id: entityId }, select: { title: true } }))?.title ?? null;
  },
  async getSlug(entityId) {
    return (await db.blogPost.findUnique({ where: { id: entityId }, select: { slug: true } }))?.slug ?? null;
  },
  async getContentHtml(entityId) {
    return (await db.blogPost.findUnique({ where: { id: entityId }, select: { content: true } }))?.content ?? "";
  },
  async exists(entityId) {
    return (await db.blogPost.count({ where: { id: entityId } })) > 0;
  },
});

registerContentAdapter({
  entityType: "product",
  label: "Products",
  async buildPath(entityId) {
    const product = await db.product.findUnique({ where: { id: entityId }, select: { slug: true } });
    return product ? `/shop/${product.slug}` : null;
  },
  async getTitle(entityId) {
    return (await db.product.findUnique({ where: { id: entityId }, select: { name: true } }))?.name ?? null;
  },
  async getSlug(entityId) {
    return (await db.product.findUnique({ where: { id: entityId }, select: { slug: true } }))?.slug ?? null;
  },
  async getContentHtml(entityId) {
    return (await db.product.findUnique({ where: { id: entityId }, select: { description: true } }))?.description ?? "";
  },
  async exists(entityId) {
    return (await db.product.count({ where: { id: entityId } })) > 0;
  },
});

registerContentAdapter({
  entityType: "category",
  label: "Blog Categories",
  async buildPath(entityId) {
    const category = await db.blogCategory.findUnique({ where: { id: entityId }, select: { slug: true } });
    return category ? `/blog/category/${category.slug}` : null;
  },
  async getTitle(entityId) {
    return (await db.blogCategory.findUnique({ where: { id: entityId }, select: { name: true } }))?.name ?? null;
  },
  async getSlug(entityId) {
    return (await db.blogCategory.findUnique({ where: { id: entityId }, select: { slug: true } }))?.slug ?? null;
  },
  async getContentHtml(entityId) {
    return (await db.blogCategory.findUnique({ where: { id: entityId }, select: { description: true } }))?.description ?? "";
  },
  async exists(entityId) {
    return (await db.blogCategory.count({ where: { id: entityId } })) > 0;
  },
});

registerContentAdapter({
  entityType: "product_category",
  label: "Product Categories",
  async buildPath(entityId) {
    const category = await db.productCategory.findUnique({ where: { id: entityId }, select: { slug: true } });
    return category ? `/category/${category.slug}` : null;
  },
  async getTitle(entityId) {
    return (await db.productCategory.findUnique({ where: { id: entityId }, select: { name: true } }))?.name ?? null;
  },
  async getSlug(entityId) {
    return (await db.productCategory.findUnique({ where: { id: entityId }, select: { slug: true } }))?.slug ?? null;
  },
  async getContentHtml(entityId) {
    return (await db.productCategory.findUnique({ where: { id: entityId }, select: { description: true } }))?.description ?? "";
  },
  async exists(entityId) {
    return (await db.productCategory.count({ where: { id: entityId } })) > 0;
  },
});

registerContentAdapter({
  entityType: "collection",
  label: "Collections",
  async buildPath(entityId) {
    const collection = await db.collection.findUnique({ where: { id: entityId }, select: { slug: true } });
    return collection ? `/collections/${collection.slug}` : null;
  },
  async getTitle(entityId) {
    return (await db.collection.findUnique({ where: { id: entityId }, select: { name: true } }))?.name ?? null;
  },
  async getSlug(entityId) {
    return (await db.collection.findUnique({ where: { id: entityId }, select: { slug: true } }))?.slug ?? null;
  },
  async getContentHtml(entityId) {
    return (await db.collection.findUnique({ where: { id: entityId }, select: { description: true } }))?.description ?? "";
  },
  async exists(entityId) {
    return (await db.collection.count({ where: { id: entityId } })) > 0;
  },
});

registerContentAdapter({
  entityType: "author",
  label: "Authors",
  async buildPath(entityId) {
    const author = await db.blogAuthor.findUnique({ where: { id: entityId }, select: { slug: true } });
    return author ? `/blog/author/${author.slug}` : null;
  },
  async getTitle(entityId) {
    return (await db.blogAuthor.findUnique({ where: { id: entityId }, select: { name: true } }))?.name ?? null;
  },
  async getSlug(entityId) {
    return (await db.blogAuthor.findUnique({ where: { id: entityId }, select: { slug: true } }))?.slug ?? null;
  },
  async getContentHtml(entityId) {
    return (await db.blogAuthor.findUnique({ where: { id: entityId }, select: { bio: true } }))?.bio ?? "";
  },
  async exists(entityId) {
    return (await db.blogAuthor.count({ where: { id: entityId } })) > 0;
  },
});
