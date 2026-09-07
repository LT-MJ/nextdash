import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getGlobalSeoSettings,
  getSitemapSettings,
  getRobotsTxtSettings,
  getBreadcrumbSettings,
  getLocalSeoSettings,
  updateGlobalSeoSettings,
  updateSitemapSettings,
  updateRobotsTxtSettings,
  updateBreadcrumbSettings,
  updateLocalSeoSettings,
} from "@/lib/seo/services/settings";
import { getSitemapSourceKeys, getSitemapSourceCount } from "@/lib/seo/sitemap";

const GETTERS = {
  global: getGlobalSeoSettings,
  sitemap: getSitemapSettings,
  robots: getRobotsTxtSettings,
  breadcrumb: getBreadcrumbSettings,
  local: getLocalSeoSettings,
} as const;

type Kind = keyof typeof GETTERS;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.settings")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const kind = new URL(request.url).searchParams.get("kind") as Kind | null;
  if (!kind || !(kind in GETTERS)) return NextResponse.json({ error: "Unknown settings kind" }, { status: 400 });

  const settings = await GETTERS[kind]();

  if (kind === "sitemap") {
    const counts: Record<string, number> = {};
    for (const key of getSitemapSourceKeys()) counts[key] = await getSitemapSourceCount(key);
    return NextResponse.json({ settings, counts });
  }

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.settings")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const kind = new URL(request.url).searchParams.get("kind") as Kind | null;
  if (!kind || !(kind in GETTERS)) return NextResponse.json({ error: "Unknown settings kind" }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  let updated;
  switch (kind) {
    case "global":
      updated = await updateGlobalSeoSettings(body);
      break;
    case "sitemap":
      updated = await updateSitemapSettings(body);
      break;
    case "robots":
      updated = await updateRobotsTxtSettings(body.content ?? "");
      break;
    case "breadcrumb":
      updated = await updateBreadcrumbSettings(body);
      break;
    case "local":
      updated = await updateLocalSeoSettings(body);
      break;
  }

  await import("@/lib/server/db").then(({ db }) =>
    db.activityLog.create({
      data: { userId: session.user.id, action: `seo.settings.${kind}.update`, entityType: "seo_settings", entityId: kind },
    })
  );

  return NextResponse.json({ settings: updated });
}
