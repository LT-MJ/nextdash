import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { listContentWithSeo } from "@/lib/seo/services/content-list";
import type { ContentTypeKey } from "@/types/seo";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const entityType = new URL(request.url).searchParams.get("entityType") as ContentTypeKey | null;
  if (!entityType) return NextResponse.json({ error: "entityType is required" }, { status: 400 });

  const items = await listContentWithSeo(entityType);
  return NextResponse.json({ items });
}
