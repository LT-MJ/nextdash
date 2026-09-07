import { auth } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/auth/permissions";

/**
 * Shared API-route auth check (mirrors the inline pattern used by the SEO
 * API routes) — returns the session when authorized, or null so the caller
 * can respond 403 without redirecting (API routes must never redirect).
 */
export async function getAuthorizedSession(permission: Permission | Permission[]) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, permission)) return null;
  return session;
}
