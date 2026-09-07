import Link from "next/link";
import { Gauge, Newspaper, ShoppingBag, AlertTriangle, ClipboardList, FileWarning } from "lucide-react";
import { db } from "@/lib/server/db";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/permissions";

export default async function AdminHomePage() {
  const session = await requireAuth();
  const permissions = session.user.permissions;

  const [avgScore, criticalIssues, notFoundCount, postCount, draftCount, productCount, pendingOrders, lowStockCount] = await Promise.all([
    db.seoMetadata.aggregate({ _avg: { seoScore: true } }),
    db.seoMetadata.count({ where: { seoGrade: "CRITICAL" } }),
    db.notFoundLog.count({ where: { resolved: false, ignored: false } }),
    hasPermission(permissions, "blog.view") ? db.blogPost.count({ where: { status: "PUBLISHED" } }) : Promise.resolve(0),
    hasPermission(permissions, "blog.view") ? db.blogPost.count({ where: { status: "DRAFT" } }) : Promise.resolve(0),
    hasPermission(permissions, "ecommerce.view") ? db.product.count({ where: { status: "ACTIVE" } }) : Promise.resolve(0),
    hasPermission(permissions, "ecommerce.orders") ? db.order.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
    hasPermission(permissions, "ecommerce.inventory")
      ? db.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM InventoryItem WHERE stock <= reorderThreshold`
      : Promise.resolve([{ count: 0n }]),
  ]);

  const lowStock = Number(lowStockCount[0]?.count ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {session.user.name?.split(" ")[0] ?? "there"}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your site.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Average SEO Score" value={avgScore._avg.seoScore ? Math.round(avgScore._avg.seoScore) : "—"} icon={Gauge} />
        <StatCard label="Critical SEO Issues" value={criticalIssues} icon={AlertTriangle} tone={criticalIssues > 0 ? "destructive" : "default"} />
        <StatCard label="Unresolved 404s" value={notFoundCount} icon={FileWarning} tone={notFoundCount > 0 ? "warning" : "default"} />
        <StatCard label="Pending Orders" value={pendingOrders} icon={ClipboardList} tone={pendingOrders > 0 ? "warning" : "default"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Website / SEO</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {criticalIssues > 0 ? `${criticalIssues} item(s) need urgent attention.` : "No critical SEO issues detected."} Visit the{" "}
            <Link className="text-primary underline" href="/admin/seo">SEO dashboard</Link> for the full health breakdown.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
            <Newspaper className="h-8 w-8 text-muted-foreground/50" />
            <span>
              {postCount} published, {draftCount} draft post(s). Manage from the{" "}
              <Link className="text-primary underline" href="/admin/blog">blog dashboard</Link>.
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Commerce</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
            <span>
              {productCount} active product(s). {pendingOrders} order(s) pending, {lowStock} low on stock. Review in the{" "}
              <Link className="text-primary underline" href="/admin/ecommerce">commerce dashboard</Link>.
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
