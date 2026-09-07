import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { tagInputSchema } from "@/lib/blog/validation";

export async function POST(request: Request) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = tagInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.blogTag.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (existing) return NextResponse.json({ error: `A tag with slug "${data.slug}" already exists.` }, { status: 409 });

  const created = await db.blogTag.create({ data: { name: data.name, slug: data.slug, description: data.description || null } });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "blog.tag.create", entityType: "tag", entityId: created.id, newValue: JSON.stringify({ name: created.name }) },
  });

  return NextResponse.json({ tag: created }, { status: 201 });
}
