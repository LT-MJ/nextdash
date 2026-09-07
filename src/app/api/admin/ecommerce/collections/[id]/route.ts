import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { collectionInputSchema } from "@/lib/ecommerce/validation";
import { getCollectionProducts } from "@/lib/ecommerce/collections";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id } = await params;
  const collection = await db.collection.findUnique({ where: { id } });
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { products, total } = await getCollectionProducts(collection, { take: 100 });
  return NextResponse.json({ collection, products, total });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id } = await params;
  const existing = await db.collection.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = collectionInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await db.collection.findUnique({ where: { slug: data.slug } });
    if (slugTaken) return NextResponse.json({ error: "A collection with this slug already exists." }, { status: 409 });
  }

  const nextType = data.type ?? existing.type;

  const updated = await db.collection.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.slug !== undefined ? { slug: data.slug } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.image !== undefined ? { image: data.image || null } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.rules !== undefined || data.type !== undefined
        ? { rules: nextType === "AUTOMATIC" ? JSON.stringify(data.rules ?? {}) : null }
        : {}),
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "collection.update", entityType: "collection", entityId: id, oldValue: JSON.stringify(existing), newValue: JSON.stringify(updated) },
  });

  return NextResponse.json({ collection: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const { id } = await params;
  const existing = await db.collection.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.collection.delete({ where: { id } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "collection.delete", entityType: "collection", entityId: id, oldValue: JSON.stringify(existing) },
  });

  return NextResponse.json({ success: true });
}
