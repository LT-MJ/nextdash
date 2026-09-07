import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { getSeoEditorData, saveSeoMetadata } from "@/lib/seo/services/content-seo";
import { seoMetadataInputSchema } from "@/lib/seo/validation";
import type { ContentTypeKey } from "@/types/seo";

interface RouteParams {
  params: Promise<{ entityType: string; entityId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { entityType, entityId } = await params;
  try {
    const data = await getSeoEditorData(entityType as ContentTypeKey, entityId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to load SEO data" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { entityType, entityId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = seoMetadataInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const saved = await saveSeoMetadata(entityType as ContentTypeKey, entityId, parsed.data, session.user.id);
    return NextResponse.json({ success: true, seoMetadata: saved });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to save SEO data" }, { status: 500 });
  }
}
