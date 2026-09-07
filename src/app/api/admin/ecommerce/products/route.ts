import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { productInputSchema } from "@/lib/ecommerce/validation";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;
  const status = searchParams.get("status");
  const categoryId = searchParams.get("category");
  const search = searchParams.get("search")?.trim();

  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? { OR: [{ name: { contains: search } }, { sku: { contains: search } }] }
      : {}),
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: { category: true, inventory: true },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, pageSize });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existingSlug = await db.product.findUnique({ where: { slug: data.slug } });
  if (existingSlug) return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });

  if (data.sku) {
    const existingSku = await db.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) return NextResponse.json({ error: "A product with this SKU already exists." }, { status: 409 });
  }

  const product = await db.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        shortDescription: data.shortDescription || null,
        sku: data.sku || null,
        barcode: data.barcode || null,
        brand: data.brand || null,
        categoryId: data.categoryId || null,
        status: data.status,
        visibility: data.visibility,
        featured: data.featured,
        price: data.price,
        compareAtPrice: data.compareAtPrice ?? null,
        costPrice: data.costPrice ?? null,
        currency: data.currency,
        weight: data.weight ?? null,
        weightUnit: data.weightUnit,
        images: JSON.stringify(data.images ?? []),
        specifications: JSON.stringify(data.specifications ?? {}),
      },
    });

    await tx.inventoryItem.create({
      data: {
        productId: created.id,
        sku: data.sku || `${created.id}-DEFAULT`,
        stock: data.initialStock ?? 0,
        reorderThreshold: data.reorderThreshold ?? 0,
      },
    });

    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "product.create",
        entityType: "product",
        entityId: created.id,
        newValue: JSON.stringify({ name: created.name, price: created.price, status: created.status }),
      },
    });

    return created;
  });

  return NextResponse.json({ product }, { status: 201 });
}
