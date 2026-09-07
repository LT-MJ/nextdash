import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { CategoryForm } from "@/components/admin/ecommerce/CategoryForm";

export default async function NewCategoryPage() {
  await requirePermission("ecommerce.products");
  const parentOptions = await db.productCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/ecommerce/categories" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Categories
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Category</h1>
      </div>
      <CategoryForm mode="create" parentOptions={parentOptions} />
    </div>
  );
}
