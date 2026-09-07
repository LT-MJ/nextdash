import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/server/db";
import { resolvePageMetadata } from "@/lib/seo/resolver";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSchemaGenerator } from "@/lib/seo/schema/generators";
import { getGlobalSeoSettings } from "@/lib/seo/services/settings";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { ProductPurchasePanel } from "@/components/shop/ProductPurchasePanel";
import { ReviewsSection } from "@/components/shop/ReviewsSection";
import { ProductGrid } from "@/components/shop/ProductGrid";

async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: { orderBy: { position: "asc" }, include: { inventory: true } },
      inventory: { where: { variantId: null } },
      reviews: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const images: string[] = product.images ? JSON.parse(product.images) : [];
  return resolvePageMetadata({
    entityType: "product",
    entityId: product.id,
    path: `/shop/${product.slug}`,
    fallbackTitle: product.name,
    fallbackDescription: product.shortDescription ?? product.description,
    fallbackImage: images[0] ?? null,
  });
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || product.status !== "ACTIVE" || product.visibility !== "PUBLIC") notFound();

  const images: string[] = product.images ? JSON.parse(product.images) : [];
  const specifications: Record<string, string> = product.specifications ? JSON.parse(product.specifications) : {};

  const baseStock = product.inventory.reduce((acc, i) => acc + i.stock, 0);
  const variantOptions = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    options: v.options ? (JSON.parse(v.options) as Record<string, string>) : {},
    stock: v.inventory.reduce((acc, i) => acc + i.stock, 0),
  }));

  const relatedProducts = product.categoryId
    ? await db.product.findMany({
        where: { categoryId: product.categoryId, status: "ACTIVE", visibility: "PUBLIC", id: { not: product.id } },
        orderBy: { createdAt: "desc" },
        take: 4,
      })
    : [];

  const globalSettings = await getGlobalSeoSettings();
  const siteUrl = globalSettings.siteUrl.replace(/\/$/, "");
  const productUrl = `${siteUrl}/shop/${product.slug}`;

  const totalStock = variantOptions.length > 0 ? variantOptions.reduce((acc, v) => acc + v.stock, 0) : baseStock;
  const averageRating = product.reviews.length > 0 ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length : null;

  const productSchema = getSchemaGenerator("Product")!.generate({
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    image: images.length > 0 ? images : undefined,
    sku: product.sku ?? undefined,
    brand: product.brand ?? undefined,
    url: productUrl,
    price: product.price,
    currency: product.currency,
    availability: totalStock > 0 ? "InStock" : "OutOfStock",
    // Never fabricate a rating — only pass one when real approved reviews exist.
    aggregateRating: averageRating !== null ? { ratingValue: Math.round(averageRating * 10) / 10, reviewCount: product.reviews.length } : null,
  });

  const breadcrumbItems = [
    { name: "Home", url: siteUrl },
    { name: "Shop", url: `${siteUrl}/shop` },
    ...(product.category ? [{ name: product.category.name, url: `${siteUrl}/category/${product.category.slug}` }] : []),
    { name: product.name, url: productUrl },
  ];
  const breadcrumbSchema = getSchemaGenerator("BreadcrumbList")!.generate({ items: breadcrumbItems });

  return (
    <div>
      <JsonLd data={[productSchema, breadcrumbSchema]} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(product.category ? [{ label: product.category.name, href: `/category/${product.category.slug}` }] : []),
          { label: product.name, href: `/shop/${product.slug}` },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No image</div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt={`${product.name} ${i + 2}`} className="aspect-square w-full rounded-md border border-border object-cover" />
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          {product.sku ? <p className="mt-1 text-xs text-muted-foreground">SKU: {product.sku}</p> : null}
          {product.shortDescription ? <p className="mt-3 text-muted-foreground">{product.shortDescription}</p> : null}

          <div className="mt-4">
            <ProductPurchasePanel
              productId={product.id}
              basePrice={product.price}
              baseCompareAtPrice={product.compareAtPrice}
              currency={product.currency}
              baseStock={baseStock}
              variants={variantOptions}
            />
          </div>
        </div>
      </div>

      {product.description ? (
        <section className="mt-10 space-y-2">
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
        </section>
      ) : null}

      {Object.keys(specifications).length > 0 ? (
        <section className="mt-10 space-y-2">
          <h2 className="text-lg font-semibold">Specifications</h2>
          <table className="w-full max-w-lg text-sm">
            <tbody>
              {Object.entries(specifications).map(([key, value]) => (
                <tr key={key} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4 font-medium text-muted-foreground">{key}</td>
                  <td className="py-2">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {relatedProducts.length > 0 ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">Related products</h2>
          <ProductGrid
            products={relatedProducts.map((p) => ({
              slug: p.slug,
              name: p.name,
              price: p.price,
              compareAtPrice: p.compareAtPrice,
              currency: p.currency,
              image: (p.images ? (JSON.parse(p.images) as string[]) : [])[0] ?? null,
            }))}
          />
        </section>
      ) : null}

      <section className="mt-10">
        <ReviewsSection reviews={product.reviews} />
      </section>

      <p className="mt-2 text-xs text-muted-foreground">
        <Link href="/shop" className="hover:underline">
          ← Back to Shop
        </Link>
      </p>
    </div>
  );
}
