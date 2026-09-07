import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import type { Permission } from "@/lib/auth/permissions";
import type { Session } from "next-auth";

/** Shared admin-API permission check, mirroring the pattern used by the SEO API routes. */
export async function requireApiPermission(
  permission: Permission | Permission[]
): Promise<{ session: Session; error: null } | { session: null; error: NextResponse }> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, permission)) {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, error: null };
}
