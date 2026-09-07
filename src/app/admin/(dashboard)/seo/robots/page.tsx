import { requirePermission } from "@/lib/auth/guard";
import { RobotsTxtEditor } from "@/components/admin/seo/RobotsTxtEditor";

export default async function RobotsTxtPage() {
  await requirePermission("seo.settings");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Robots.txt</h1>
        <p className="text-sm text-muted-foreground">Edit the raw robots.txt served at the site root.</p>
      </div>
      <RobotsTxtEditor />
    </div>
  );
}
