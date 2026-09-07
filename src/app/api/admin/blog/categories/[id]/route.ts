import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { categoryInputSchema } from "@/lib/blog/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** True if `candidateAncestorId` is `categoryId` itself or one of its ancestors — used to reject cycles when reparenting. */
async function wouldCreateCycle(categoryId: string, candidateParentId: string): Promise<boolean> {
  let current: string | null = candidateParentId;
  const seen = new Set<string>();
  while (current) {
    if (current === categoryId) return true;
    if (seen.has(current)) return true; // pre-existing cycle guard
    seen.add(current);
    const row: { parentId: string | null } | null = await db.blogCategory.findUnique({ where: { id: current }, select: { parentId: true } });
    current = row?.parentId ?? null;
  }
  return false;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.blogCategory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (data.slug !== existing.slug) {
    const slugTaken = await db.blogCategory.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (slugTaken) return NextResponse.json({ error: `A category with slug "${data.slug}" already exists.` }, { status: 409 });
  }

  if (data.parentId) {
    if (data.parentId === id) return NextResponse.json({ error: "A category cannot be its own parent." }, { status: 400 });
    if (await wouldCreateCycle(id, data.parentId)) {
      return NextResponse.json({ error: "That parent would create a circular category tree." }, { status: 400 });
    }
  }

  const updated = await db.blogCategory.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      parentId: data.parentId || null,
      featuredImage: data.featuredImage || null,
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "blog.category.update", entityType: "category", entityId: id, newValue: JSON.stringify({ name: updated.name }) },
  });

  return NextResponse.json({ category: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await db.blogCategory.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.blogCategory.delete({ where: { id } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "blog.category.delete", entityType: "category", entityId: id, oldValue: JSON.stringify({ name: existing.name }) },
  });

  return NextResponse.json({ success: true });
}
