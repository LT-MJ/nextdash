import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const addProductSchema = z.object({ productId: z.string().min(1) });

export async function POST(request: Request, { params }: RouteParams) {
  const { error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id: collectionId } = await params;
  const collection = await db.collection.findUnique({ where: { id: collectionId } });
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (collection.type !== "MANUAL") {
    return NextResponse.json({ error: "Products can only be manually added to MANUAL collections." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = addProductSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const product = await db.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const existing = await db.collectionProduct.findUnique({
    where: { collectionId_productId: { collectionId, productId: parsed.data.productId } },
  });
  if (existing) return NextResponse.json({ error: "Product is already in this collection." }, { status: 409 });

  const maxPosition = await db.collectionProduct.aggregate({ where: { collectionId }, _max: { position: true } });

  const created = await db.collectionProduct.create({
    data: { collectionId, productId: parsed.data.productId, position: (maxPosition._max.position ?? -1) + 1 },
    include: { product: true },
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
