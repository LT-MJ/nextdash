import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { categoryInputSchema } from "@/lib/ecommerce/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id } = await params;
  const existing = await db.productCategory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = categoryInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (data.parentId && data.parentId === id) {
    return NextResponse.json({ error: "A category cannot be its own parent." }, { status: 400 });
  }
  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await db.productCategory.findUnique({ where: { slug: data.slug } });
    if (slugTaken) return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });
  }

  const updated = await db.productCategory.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.slug !== undefined ? { slug: data.slug } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.parentId !== undefined ? { parentId: data.parentId || null } : {}),
      ...(data.image !== undefined ? { image: data.image || null } : {}),
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "product_category.update", entityType: "product_category", entityId: id, oldValue: JSON.stringify(existing), newValue: JSON.stringify(updated) },
  });

  return NextResponse.json({ category: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id } = await params;
  const existing = await db.productCategory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const productCount = await db.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return NextResponse.json({ error: `Cannot delete: ${productCount} product(s) still reference this category.` }, { status: 409 });
  }

  await db.productCategory.delete({ where: { id } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "product_category.delete", entityType: "product_category", entityId: id, oldValue: JSON.stringify(existing) },
  });

  return NextResponse.json({ success: true });
}
