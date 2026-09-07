import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { authorInputSchema } from "@/lib/blog/validation";

export async function POST(request: Request) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = authorInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.blogAuthor.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (existing) return NextResponse.json({ error: `An author with slug "${data.slug}" already exists.` }, { status: 409 });

  const created = await db.blogAuthor.create({
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
    data: { userId: session.user.id, action: "blog.author.create", entityType: "author", entityId: created.id, newValue: JSON.stringify({ name: created.name }) },
  });

  return NextResponse.json({ author: created }, { status: 201 });
}
