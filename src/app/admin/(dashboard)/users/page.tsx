import { requirePermission } from "@/lib/auth/guard";
import { UsersManager } from "@/components/admin/UsersManager";

export default async function UsersPage() {
  const session = await requirePermission("system.users");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users & Roles</h1>
        <p className="text-sm text-muted-foreground">Manage admin accounts and their assigned role.</p>
      </div>
      <UsersManager currentUserId={session.user.id} />
    </div>
  );
}
