import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { variantInputSchema } from "@/lib/ecommerce/validation";

interface RouteParams {
  params: Promise<{ id: string; variantId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id: productId, variantId } = await params;
  const existing = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!existing || existing.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = variantInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (data.sku && data.sku !== existing.sku) {
    const skuTaken = await db.productVariant.findUnique({ where: { sku: data.sku } });
    if (skuTaken) return NextResponse.json({ error: "A variant with this SKU already exists." }, { status: 409 });
  }

  const updated = await db.productVariant.update({
    where: { id: variantId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.sku !== undefined ? { sku: data.sku || null } : {}),
      ...(data.price !== undefined ? { price: data.price ?? null } : {}),
      ...(data.compareAtPrice !== undefined ? { compareAtPrice: data.compareAtPrice ?? null } : {}),
      ...(data.barcode !== undefined ? { barcode: data.barcode || null } : {}),
      ...(data.image !== undefined ? { image: data.image || null } : {}),
      ...(data.weight !== undefined ? { weight: data.weight ?? null } : {}),
      ...(data.options !== undefined ? { options: JSON.stringify(data.options) } : {}),
      ...(data.position !== undefined ? { position: data.position } : {}),
    },
  });

  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "product.variant.update",
      entityType: "product",
      entityId: productId,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updated),
    },
  });

  return NextResponse.json({ variant: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id: productId, variantId } = await params;
  const existing = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!existing || existing.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.productVariant.delete({ where: { id: variantId } });
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "product.variant.delete",
      entityType: "product",
      entityId: productId,
      oldValue: JSON.stringify(existing),
    },
  });

  return NextResponse.json({ success: true });
}
