import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { productInputSchema } from "@/lib/ecommerce/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: { orderBy: { position: "asc" }, include: { inventory: true } },
      inventory: true,
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id } = await params;
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await db.product.findUnique({ where: { slug: data.slug } });
    if (slugTaken) return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });
  }
  if (data.sku && data.sku !== existing.sku) {
    const skuTaken = await db.product.findUnique({ where: { sku: data.sku } });
    if (skuTaken) return NextResponse.json({ error: "A product with this SKU already exists." }, { status: 409 });
  }

  const updated = await db.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.shortDescription !== undefined ? { shortDescription: data.shortDescription || null } : {}),
        ...(data.sku !== undefined ? { sku: data.sku || null } : {}),
        ...(data.barcode !== undefined ? { barcode: data.barcode || null } : {}),
        ...(data.brand !== undefined ? { brand: data.brand || null } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId || null } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.visibility !== undefined ? { visibility: data.visibility } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.compareAtPrice !== undefined ? { compareAtPrice: data.compareAtPrice ?? null } : {}),
        ...(data.costPrice !== undefined ? { costPrice: data.costPrice ?? null } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.weight !== undefined ? { weight: data.weight ?? null } : {}),
        ...(data.weightUnit !== undefined ? { weightUnit: data.weightUnit } : {}),
        ...(data.images !== undefined ? { images: JSON.stringify(data.images) } : {}),
        ...(data.specifications !== undefined ? { specifications: JSON.stringify(data.specifications) } : {}),
      },
    });

    // Price-change audit trail — required regardless of what else changed.
    if (data.price !== undefined && data.price !== existing.price) {
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "product.price.change",
          entityType: "product",
          entityId: id,
          field: "price",
          oldValue: JSON.stringify(existing.price),
          newValue: JSON.stringify(data.price),
        },
      });
    }

    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "product.update",
        entityType: "product",
        entityId: id,
        oldValue: JSON.stringify(existing),
        newValue: JSON.stringify(product),
      },
    });

    return product;
  });

  return NextResponse.json({ product: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id } = await params;
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.product.delete({ where: { id } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "product.delete", entityType: "product", entityId: id, oldValue: JSON.stringify(existing) },
  });

  return NextResponse.json({ success: true });
}
