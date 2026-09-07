import { requireAuth } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/permissions";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { SessionProviderWrapper } from "@/components/admin/SessionProviderWrapper";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const permissions = session.user.permissions;

  const visibleSections = ADMIN_NAV.map((section) => ({
    label: section.label,
    items: section.items
      .filter((item) => !item.permission || hasPermission(permissions, item.permission))
      .map((item) => ({
        label: item.label,
        href: item.href,
        // Render the icon here (Server Component) so only a plain React
        // element — not a component reference — crosses into the Client
        // Component sidebar below (functions can't cross that boundary).
        icon: <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden />,
      })),
  })).filter((section) => section.items.length > 0);

  return (
    <SessionProviderWrapper>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar sections={visibleSections} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminTopbar userName={session.user.name ?? session.user.email ?? "User"} roleName={session.user.roleName} />
          <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
        </div>
      </div>
    </SessionProviderWrapper>
  );
}
