import { Gauge, Newspaper, ShoppingBag, AlertTriangle } from "lucide-react";
import { db } from "@/lib/server/db";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/permissions";

export default async function AdminHomePage() {
  const session = await requireAuth();
  const permissions = session.user.permissions;

  const [avgScore, criticalIssues, postCount, productCount, pendingOrders] = await Promise.all([
    db.seoMetadata.aggregate({ _avg: { seoScore: true } }),
    db.seoMetadata.count({ where: { seoScore: { lt: 40 } } }),
    hasPermission(permissions, "blog.view") ? db.blogPost.count({ where: { status: "PUBLISHED" } }) : Promise.resolve(0),
    hasPermission(permissions, "ecommerce.view") ? db.product.count({ where: { status: "ACTIVE" } }) : Promise.resolve(0),
    hasPermission(permissions, "ecommerce.orders") ? db.order.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {session.user.name?.split(" ")[0] ?? "there"}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your site.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Average SEO Score" value={avgScore._avg.seoScore ? Math.round(avgScore._avg.seoScore) : "—"} icon={Gauge} />
        <StatCard label="Critical SEO Issues" value={criticalIssues} icon={AlertTriangle} tone={criticalIssues > 0 ? "destructive" : "default"} />
        <StatCard label="Published Posts" value={postCount} icon={Newspaper} />
        <StatCard label="Active Products" value={productCount} icon={ShoppingBag} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>SEO Health</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Visit the <a className="text-primary underline" href="/admin/seo">SEO dashboard</a> for the full health breakdown, priority issues, and content-type scoring.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {postCount} published post(s). Manage drafts and scheduling from the <a className="text-primary underline" href="/admin/blog">blog dashboard</a>.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Commerce</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {pendingOrders} order(s) pending. Review them in the <a className="text-primary underline" href="/admin/ecommerce/orders">orders queue</a>.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
