import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { collectionInputSchema } from "@/lib/ecommerce/validation";

export async function GET() {
  const { error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const collections = await db.collection.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ collections });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = collectionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.collection.findUnique({ where: { slug: data.slug } });
  if (existing) return NextResponse.json({ error: "A collection with this slug already exists." }, { status: 409 });

  const collection = await db.collection.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      image: data.image || null,
      type: data.type,
      rules: data.type === "AUTOMATIC" && data.rules ? JSON.stringify(data.rules) : null,
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "collection.create", entityType: "collection", entityId: collection.id, newValue: JSON.stringify(collection) },
  });

  return NextResponse.json({ collection }, { status: 201 });
}
