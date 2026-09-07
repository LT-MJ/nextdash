import { db } from "@/lib/server/db";
import type { Prisma } from "@prisma/client";

/** Rule shape stored as JSON in Collection.rules for AUTOMATIC collections. */
export interface CollectionRules {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  featured?: boolean;
}

export function parseCollectionRules(rulesJson: string | null): CollectionRules {
  if (!rulesJson) return {};
  try {
    return JSON.parse(rulesJson) as CollectionRules;
  } catch {
    return {};
  }
}

function buildAutomaticWhere(rules: CollectionRules): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    visibility: "PUBLIC",
  };
  if (rules.categoryId) where.categoryId = rules.categoryId;
  if (rules.brand) where.brand = rules.brand;
  if (rules.featured != null) where.featured = rules.featured;
  if (rules.minPrice != null || rules.maxPrice != null) {
    where.price = {
      ...(rules.minPrice != null ? { gte: rules.minPrice } : {}),
      ...(rules.maxPrice != null ? { lte: rules.maxPrice } : {}),
    };
  }
  return where;
}

/**
 * Resolves the product list for a Collection regardless of type — MANUAL
 * collections resolve via the CollectionProduct join (ordered by
 * `position`), AUTOMATIC collections evaluate `Collection.rules` against the
 * Product table live. Used by both the admin preview and the public
 * `/collections/[slug]` page so the two never drift apart.
 */
export async function getCollectionProducts(
  collection: { id: string; type: string; rules: string | null },
  { skip = 0, take = 24 }: { skip?: number; take?: number } = {}
) {
  if (collection.type === "AUTOMATIC") {
    return getAutomaticCollectionProducts(collection, { skip, take });
  }

  const [rows, total] = await Promise.all([
    db.collectionProduct.findMany({
      where: { collectionId: collection.id },
      orderBy: { position: "asc" },
      skip,
      take,
      include: { product: { include: { category: true, inventory: true } } },
    }),
    db.collectionProduct.count({ where: { collectionId: collection.id } }),
  ]);

  return { products: rows.map((r) => r.product), total };
}

export async function getAutomaticCollectionProducts(
  collection: { rules: string | null },
  { skip = 0, take = 24 }: { skip?: number; take?: number } = {}
) {
  const rules = parseCollectionRules(collection.rules);
  const where = buildAutomaticWhere(rules);

  const [products, total] = await Promise.all([
    db.product.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, include: { category: true, inventory: true } }),
    db.product.count({ where }),
  ]);

  return { products, total };
}
