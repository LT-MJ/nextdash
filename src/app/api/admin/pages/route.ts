import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { pageInputSchema } from "@/lib/pages/validation";

export async function GET() {
  const session = await getAuthorizedSession("pages.view");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pages = await db.page.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
  return NextResponse.json({ pages });
}

export async function POST(request: Request) {
  const session = await getAuthorizedSession("pages.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = pageInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (data.status === "PUBLISHED" && !session.user.permissions.includes("pages.publish")) {
    return NextResponse.json({ error: "You do not have permission to publish pages." }, { status: 403 });
  }

  const existing = await db.page.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: `A page with slug "${data.slug}" already exists.` }, { status: 409 });
  }

  const created = await db.page.create({
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content ?? "",
      status: data.status,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "page.create", entityType: "page", entityId: created.id, newValue: JSON.stringify({ title: created.title, status: created.status }) },
  });

  return NextResponse.json({ page: created }, { status: 201 });
}
