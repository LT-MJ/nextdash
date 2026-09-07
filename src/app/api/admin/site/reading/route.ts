import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { getReadingSettings, updateReadingSettings } from "@/lib/site/settings";
import { readingSettingsInputSchema } from "@/lib/site/validation";

export async function GET() {
  const session = await getAuthorizedSession("site.settings");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [settings, pages] = await Promise.all([
    getReadingSettings(),
    db.page.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true, slug: true }, orderBy: { title: "asc" } }),
  ]);
  return NextResponse.json({ settings, pages });
}

export async function PATCH(request: Request) {
  const session = await getAuthorizedSession("site.settings");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = readingSettingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  for (const pageId of [data.homepagePageId, data.blogPageId].filter((id): id is string => !!id)) {
    const page = await db.page.findUnique({ where: { id: pageId }, select: { status: true } });
    if (!page || page.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Only published pages can be assigned." }, { status: 400 });
    }
  }

  const existing = await getReadingSettings();
  const updated = await updateReadingSettings(data);

  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "site.reading.update",
      entityType: "site_settings",
      entityId: "reading",
      oldValue: JSON.stringify({ homepageMode: existing.homepageMode, homepagePageId: existing.homepagePageId, blogPageId: existing.blogPageId }),
      newValue: JSON.stringify({ homepageMode: updated.homepageMode, homepagePageId: updated.homepagePageId, blogPageId: updated.blogPageId }),
    },
  });

  return NextResponse.json({ settings: updated });
}
