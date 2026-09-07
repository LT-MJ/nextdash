import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { ProductGeneralForm } from "@/components/admin/ecommerce/ProductGeneralForm";

export default async function NewProductPage() {
  await requirePermission("ecommerce.products");
  const categories = await db.productCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/ecommerce/products" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Product</h1>
        <p className="text-sm text-muted-foreground">Variants, inventory adjustments, and SEO become available after the first save.</p>
      </div>
      <ProductGeneralForm mode="create" categories={categories} />
    </div>
  );
}
