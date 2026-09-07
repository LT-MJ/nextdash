import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { categoryInputSchema } from "@/lib/blog/validation";

export async function POST(request: Request) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.blogCategory.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (existing) return NextResponse.json({ error: `A category with slug "${data.slug}" already exists.` }, { status: 409 });

  const created = await db.blogCategory.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      parentId: data.parentId || null,
      featuredImage: data.featuredImage || null,
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "blog.category.create", entityType: "category", entityId: created.id, newValue: JSON.stringify({ name: created.name }) },
  });

  return NextResponse.json({ category: created }, { status: 201 });
}
