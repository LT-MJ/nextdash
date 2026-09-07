import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/admin/ecommerce/DeleteButton";

export default async function CollectionsPage() {
  await requirePermission("ecommerce.products");
  const collections = await db.collection.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground">Curated or rule-based groupings of products.</p>
        </div>
        <Button asChild>
          <Link href="/admin/ecommerce/collections/new">
            <Plus className="h-4 w-4" /> New Collection
          </Link>
        </Button>
      </div>

      {collections.length === 0 ? (
        <EmptyState icon={Package} title="No collections have been created yet." description="Group products manually or with automatic rules." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((collection) => (
              <TableRow key={collection.id}>
                <TableCell>
                  <Link href={`/admin/ecommerce/collections/${collection.id}`} className="font-medium text-primary hover:underline">
                    {collection.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">/collections/{collection.slug}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={collection.type === "AUTOMATIC" ? "outline" : "secondary"}>{collection.type === "AUTOMATIC" ? "Automatic" : "Manual"}</Badge>
                </TableCell>
                <TableCell>{collection.type === "AUTOMATIC" ? "Rule-based" : collection._count.products}</TableCell>
                <TableCell>
                  <DeleteButton url={`/api/admin/ecommerce/collections/${collection.id}`} confirmText={`Delete collection "${collection.name}"?`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
