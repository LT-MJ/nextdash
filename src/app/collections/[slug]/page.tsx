import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { resolvePageMetadata } from "@/lib/seo/resolver";
import { getCollectionProducts } from "@/lib/ecommerce/collections";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ShopPagination } from "@/components/shop/ShopPagination";

const PAGE_SIZE = 12;

async function getCollection(slug: string) {
  return db.collection.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return {};
  return resolvePageMetadata({
    entityType: "collection",
    entityId: collection.id,
    path: `/collections/${collection.slug}`,
    fallbackTitle: collection.name,
    fallbackDescription: collection.description,
    fallbackImage: collection.image,
  });
}

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  const page = Math.max(1, Number(pageParam ?? "1"));
  const { products, total } = await getCollectionProducts(collection, { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: collection.name, href: `/collections/${collection.slug}` }]} />
      <h1 className="mb-2 text-2xl font-bold tracking-tight">{collection.name}</h1>
      {collection.description ? <p className="mb-6 max-w-2xl text-muted-foreground">{collection.description}</p> : <div className="mb-6" />}
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
      <ShopPagination page={page} pageSize={PAGE_SIZE} total={total} basePath={`/collections/${collection.slug}`} />
    </div>
  );
}
