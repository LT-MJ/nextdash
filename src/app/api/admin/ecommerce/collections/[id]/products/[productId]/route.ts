import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";

interface RouteParams {
  params: Promise<{ id: string; productId: string }>;
}

const positionSchema = z.object({ direction: z.enum(["up", "down"]) });

export async function PATCH(request: Request, { params }: RouteParams) {
  const { error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id: collectionId, productId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = positionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const current = await db.collectionProduct.findUnique({ where: { collectionId_productId: { collectionId, productId } } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const neighbor = await db.collectionProduct.findFirst({
    where: {
      collectionId,
      position: parsed.data.direction === "up" ? { lt: current.position } : { gt: current.position },
    },
    orderBy: { position: parsed.data.direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return NextResponse.json({ success: true }); // already at the edge

  await db.$transaction([
    db.collectionProduct.update({
      where: { collectionId_productId: { collectionId, productId: neighbor.productId } },
      data: { position: current.position },
    }),
    db.collectionProduct.update({
      where: { collectionId_productId: { collectionId, productId } },
      data: { position: neighbor.position },
    }),
  ]);

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id: collectionId, productId } = await params;
  const existing = await db.collectionProduct.findUnique({ where: { collectionId_productId: { collectionId, productId } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.collectionProduct.delete({ where: { collectionId_productId: { collectionId, productId } } });
  return NextResponse.json({ success: true });
}
