import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { pageInputSchema } from "@/lib/pages/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("pages.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = pageInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.page.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only a genuine transition into PUBLISHED requires pages.publish — saving
  // an already-published page (with status left unchanged) is an ordinary edit.
  if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED" && !session.user.permissions.includes("pages.publish")) {
    return NextResponse.json({ error: "You do not have permission to publish pages." }, { status: 403 });
  }

  if (data.slug !== existing.slug) {
    const slugTaken = await db.page.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (slugTaken) return NextResponse.json({ error: `A page with slug "${data.slug}" already exists.` }, { status: 409 });
  }

  const publishedAt = data.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt;

  const updated = await db.page.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content ?? "",
      status: data.status,
      publishedAt,
    },
  });

  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "page.update",
      entityType: "page",
      entityId: updated.id,
      oldValue: JSON.stringify({ title: existing.title, slug: existing.slug, status: existing.status }),
      newValue: JSON.stringify({ title: updated.title, slug: updated.slug, status: updated.status }),
    },
  });

  return NextResponse.json({ page: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("pages.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await db.page.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.page.delete({ where: { id } });
  // Deleting the page doesn't cascade to its polymorphic SeoMetadata row
  // (entityType/entityId isn't a real foreign key), so clean it up explicitly.
  await db.seoMetadata.deleteMany({ where: { entityType: "page", entityId: id } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "page.delete", entityType: "page", entityId: id, oldValue: JSON.stringify({ title: existing.title }) },
  });

  return NextResponse.json({ success: true });
}
