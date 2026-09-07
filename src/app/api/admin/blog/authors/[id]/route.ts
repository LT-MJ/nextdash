import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { authorInputSchema } from "@/lib/blog/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = authorInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.blogAuthor.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (data.slug !== existing.slug) {
    const slugTaken = await db.blogAuthor.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (slugTaken) return NextResponse.json({ error: `An author with slug "${data.slug}" already exists.` }, { status: 409 });
  }

  const updated = await db.blogAuthor.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      profileImage: data.profileImage || null,
      bio: data.bio || null,
      email: data.email || null,
      website: data.website || null,
      socialProfiles: JSON.stringify(data.socialProfiles ?? []),
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "blog.author.update", entityType: "author", entityId: id, newValue: JSON.stringify({ name: updated.name }) },
  });

  return NextResponse.json({ author: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await db.blogAuthor.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.blogAuthor.delete({ where: { id } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "blog.author.delete", entityType: "author", entityId: id, oldValue: JSON.stringify({ name: existing.name }) },
  });

  return NextResponse.json({ success: true });
}
