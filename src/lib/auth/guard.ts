import { redirect } from "next/navigation";
import { auth } from "./index";
import { hasPermission, hasAnyPermission, type Permission } from "./permissions";

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session;
}

export async function requirePermission(permission: Permission | Permission[]) {
  const session = await requireAuth();
  if (!hasPermission(session.user.permissions, permission)) {
    redirect("/admin?error=forbidden");
  }
  return session;
}

export async function requireAnyPermission(permissions: Permission[]) {
  const session = await requireAuth();
  if (!hasAnyPermission(session.user.permissions, permissions)) {
    redirect("/admin?error=forbidden");
  }
  return session;
}
