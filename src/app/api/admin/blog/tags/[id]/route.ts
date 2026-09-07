import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { tagInputSchema } from "@/lib/blog/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = tagInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.blogTag.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (data.slug !== existing.slug) {
    const slugTaken = await db.blogTag.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (slugTaken) return NextResponse.json({ error: `A tag with slug "${data.slug}" already exists.` }, { status: 409 });
  }

  const updated = await db.blogTag.update({
    where: { id },
    data: { name: data.name, slug: data.slug, description: data.description || null },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "blog.tag.update", entityType: "tag", entityId: id, newValue: JSON.stringify({ name: updated.name }) },
  });

  return NextResponse.json({ tag: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await db.blogTag.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.blogTag.delete({ where: { id } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "blog.tag.delete", entityType: "tag", entityId: id, oldValue: JSON.stringify({ name: existing.name }) },
  });

  return NextResponse.json({ success: true });
}
