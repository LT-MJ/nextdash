import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { resolvePageMetadata } from "@/lib/seo/resolver";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ShopPagination } from "@/components/shop/ShopPagination";

const PAGE_SIZE = 12;

async function getCategory(slug: string) {
  return db.productCategory.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  return resolvePageMetadata({
    entityType: "product_category",
    entityId: category.id,
    path: `/category/${category.slug}`,
    fallbackTitle: category.name,
    fallbackDescription: category.description,
    fallbackImage: category.image,
  });
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  const page = Math.max(1, Number(pageParam ?? "1"));
  const where = { categoryId: category.id, status: "ACTIVE" as const, visibility: "PUBLIC" as const };

  const [products, total] = await Promise.all([
    db.product.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.product.count({ where }),
  ]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: category.name, href: `/category/${category.slug}` }]} />
      <h1 className="mb-2 text-2xl font-bold tracking-tight">{category.name}</h1>
      {category.description ? <p className="mb-6 max-w-2xl text-muted-foreground">{category.description}</p> : <div className="mb-6" />}
      <ProductGrid
        products={products.map((p) => ({
          slug: p.slug,
          name: p.name,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          currency: p.currency,
          image: (p.images ? (JSON.parse(p.images) as string[]) : [])[0] ?? null,
        }))}
      />
      <ShopPagination page={page} pageSize={PAGE_SIZE} total={total} basePath={`/category/${category.slug}`} />
    </div>
  );
}
