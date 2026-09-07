import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { CategoryForm } from "@/components/admin/ecommerce/CategoryForm";
import { SeoEditorPanel } from "@/components/seo/SeoEditorPanel";

export default async function CategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("ecommerce.products");
  const { id } = await params;

  const [category, parentOptions] = await Promise.all([
    db.productCategory.findUnique({ where: { id } }),
    db.productCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!category) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/ecommerce/categories" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Categories
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <CategoryForm mode="edit" parentOptions={parentOptions} initial={category} />
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">SEO</h2>
        <SeoEditorPanel entityType="product_category" entityId={category.id} />
      </section>
    </div>
  );
}
