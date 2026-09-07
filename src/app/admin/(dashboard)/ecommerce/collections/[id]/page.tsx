import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { CollectionForm } from "@/components/admin/ecommerce/CollectionForm";
import { CollectionProductPicker } from "@/components/admin/ecommerce/CollectionProductPicker";
import { SeoEditorPanel } from "@/components/seo/SeoEditorPanel";
import { getCollectionProducts } from "@/lib/ecommerce/collections";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";

export default async function CollectionEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("ecommerce.products");
  const { id } = await params;

  const [collection, categories] = await Promise.all([
    db.collection.findUnique({ where: { id } }),
    db.productCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!collection) notFound();

  const { products } = await getCollectionProducts(collection, { take: 100 });

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/ecommerce/collections" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Collections
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <CollectionForm mode="edit" categories={categories} initial={collection} />
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">Products</h2>
        {collection.type === "MANUAL" ? (
          <CollectionProductPicker
            collectionId={collection.id}
            initialProducts={products.map((p) => ({ productId: p.id, name: p.name, sku: p.sku, price: p.price, currency: p.currency }))}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Live preview of products currently matched by this collection&apos;s rules.</p>
            {products.length === 0 ? (
              <EmptyState title="No products currently match these rules." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs">{p.sku ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(p.price, p.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">SEO</h2>
        <SeoEditorPanel entityType="collection" entityId={collection.id} />
      </section>
    </div>
  );
}
