import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { variantInputSchema } from "@/lib/ecommerce/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id: productId } = await params;
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = variantInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (data.sku) {
    const existingSku = await db.productVariant.findUnique({ where: { sku: data.sku } });
    if (existingSku) return NextResponse.json({ error: "A variant with this SKU already exists." }, { status: 409 });
  }

  const variant = await db.$transaction(async (tx) => {
    const created = await tx.productVariant.create({
      data: {
        productId,
        name: data.name,
        sku: data.sku || null,
        price: data.price ?? null,
        compareAtPrice: data.compareAtPrice ?? null,
        barcode: data.barcode || null,
        image: data.image || null,
        weight: data.weight ?? null,
        options: JSON.stringify(data.options ?? {}),
        position: data.position ?? 0,
      },
    });

    await tx.inventoryItem.create({
      data: {
        variantId: created.id,
        sku: data.sku || `${created.id}-VARIANT`,
        stock: data.initialStock ?? 0,
        reorderThreshold: 0,
      },
    });

    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "product.variant.create",
        entityType: "product",
        entityId: productId,
        newValue: JSON.stringify({ variantId: created.id, name: created.name }),
      },
    });

    return created;
  });

  return NextResponse.json({ variant }, { status: 201 });
}
