import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { getHeaderFooterSettings, updateHeaderFooterSettings } from "@/lib/site/settings";
import { headerFooterSettingsInputSchema } from "@/lib/site/validation";

export async function GET() {
  const session = await getAuthorizedSession("site.settings");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [settings, menus] = await Promise.all([getHeaderFooterSettings(), db.menu.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })]);
  return NextResponse.json({ settings, menus });
}

export async function PATCH(request: Request) {
  const session = await getAuthorizedSession("site.settings");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = headerFooterSettingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const updated = await updateHeaderFooterSettings({
    ...data,
    footerColumns: data.footerColumns !== undefined ? JSON.stringify(data.footerColumns) : undefined,
    socialLinks: data.socialLinks !== undefined ? JSON.stringify(data.socialLinks) : undefined,
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "site.header_footer.update", entityType: "site_settings", entityId: "header_footer" },
  });

  return NextResponse.json({ settings: updated });
}
