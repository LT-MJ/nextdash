import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { categoryInputSchema } from "@/lib/ecommerce/validation";

export async function GET() {
  const { error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const categories = await db.productCategory.findMany({
    include: { parent: true, _count: { select: { products: true, children: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiPermission("ecommerce.products");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.productCategory.findUnique({ where: { slug: data.slug } });
  if (existing) return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });

  const category = await db.productCategory.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      parentId: data.parentId || null,
      image: data.image || null,
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "product_category.create", entityType: "product_category", entityId: category.id, newValue: JSON.stringify(category) },
  });

  return NextResponse.json({ category }, { status: 201 });
}
