import type { Metadata } from "next";
import { db } from "@/lib/server/db";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { ShopPagination } from "@/components/shop/ShopPagination";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 12;

// No SEO content adapter exists for the shop index, so this is a plain static metadata block rather than a resolveSeo() call.
export const metadata: Metadata = {
  title: "Shop",
  description: "Browse our full product catalog.",
};

export default async function ShopIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const categoryId = sp.category;
  const search = sp.search?.trim();

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    visibility: "PUBLIC",
    ...(categoryId ? { categoryId } : {}),
    ...(search ? { OR: [{ name: { contains: search } }, { shortDescription: { contains: search } }] } : {}),
  };

  const [products, total, categories] = await Promise.all([
    db.product.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.product.count({ where }),
    db.productCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const cards = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    currency: p.currency,
    image: (p.images ? (JSON.parse(p.images) as string[]) : [])[0] ?? null,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Shop</h1>
      <ShopFilters categories={categories} />
      <ProductGrid products={cards} />
      <ShopPagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/shop" searchParams={{ category: categoryId, search }} />
    </div>
  );
}
