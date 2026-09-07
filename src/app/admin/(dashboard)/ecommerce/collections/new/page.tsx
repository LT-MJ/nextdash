import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { CollectionForm } from "@/components/admin/ecommerce/CollectionForm";

export default async function NewCollectionPage() {
  await requirePermission("ecommerce.products");
  const categories = await db.productCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/ecommerce/collections" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Collections
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Collection</h1>
        <p className="text-sm text-muted-foreground">Add products and SEO become available after the first save.</p>
      </div>
      <CollectionForm mode="create" categories={categories} />
    </div>
  );
}
