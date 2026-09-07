import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { bulkUpdateSeoFlags } from "@/lib/seo/services/content-seo";
import type { ContentTypeKey } from "@/types/seo";

const bulkSchema = z.object({
  entityType: z.string(),
  entityIds: z.array(z.string()).min(1).max(500),
  changes: z.object({
    robotsIndex: z.boolean().optional(),
    robotsFollow: z.boolean().optional(),
    sitemapInclude: z.boolean().optional(),
  }),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = bulkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });

  const updated = await bulkUpdateSeoFlags(
    parsed.data.entityType as ContentTypeKey,
    parsed.data.entityIds,
    parsed.data.changes,
    session.user.id
  );
  return NextResponse.json({ success: true, updated });
}
