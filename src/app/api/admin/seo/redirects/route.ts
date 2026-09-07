import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { redirectInputSchema } from "@/lib/seo/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.redirects")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const redirects = await db.redirect.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ redirects });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.redirects")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = redirectInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { source, destination } = parsed.data;

  if (source === destination) {
    return NextResponse.json({ error: "Source and destination cannot be the same URL (self-redirect)." }, { status: 400 });
  }

  // Detect redirect chains: does the destination itself have an outgoing redirect?
  const chained = await db.redirect.findFirst({ where: { source: destination, enabled: true } });
  const warning = chained ? `Warning: destination "${destination}" is itself redirected to "${chained.destination}" — consider flattening this chain.` : null;

  const existing = await db.redirect.findUnique({ where: { source } });
  if (existing) {
    return NextResponse.json({ error: `A redirect for "${source}" already exists.` }, { status: 409 });
  }

  const created = await db.redirect.create({
    data: {
      source,
      destination,
      statusCode: parsed.data.statusCode,
      enabled: parsed.data.enabled ?? true,
      isRegex: parsed.data.isRegex ?? false,
      notes: parsed.data.notes ?? null,
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "redirect.create", entityType: "redirect", entityId: created.id, newValue: JSON.stringify(created) },
  });

  return NextResponse.json({ redirect: created, warning }, { status: 201 });
}
