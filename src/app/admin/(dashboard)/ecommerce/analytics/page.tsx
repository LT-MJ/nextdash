import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/StatCard";
import { RevenueChart, type RevenuePoint } from "@/components/admin/ecommerce/RevenueChart";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { DollarSign, ShoppingCart, Receipt } from "lucide-react";

const RANGES = {
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 90 days", days: 90 },
  "1y": { label: "Last 12 months", days: 365 },
} as const;

type RangeKey = keyof typeof RANGES;

export default async function EcommerceAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requirePermission("ecommerce.analytics");
  const { range: rawRange } = await searchParams;
  const range: RangeKey = rawRange && rawRange in RANGES ? (rawRange as RangeKey) : "30d";
  const { days } = RANGES[range];

  const start = new Date();
  start.setDate(start.getDate() - days);

  const [paidAgg, orderCount, rows] = await Promise.all([
    db.order.aggregate({ where: { paymentStatus: "PAID", createdAt: { gte: start } }, _sum: { total: true }, _count: true }),
    db.order.count({ where: { createdAt: { gte: start } } }),
    db.$queryRaw<{ day: string; revenue: number | null; orders: bigint }[]>`
      SELECT strftime('%Y-%m-%d', "createdAt") as day, SUM("total") as revenue, COUNT(*) as orders
      FROM "Order"
      WHERE "paymentStatus" = 'PAID' AND "createdAt" >= ${start}
      GROUP BY day
      ORDER BY day ASC
    `,
  ]);

  const revenue = paidAgg._sum.total ?? 0;
  const paidOrders = paidAgg._count;
  const aov = paidOrders > 0 ? revenue / paidOrders : 0;

  const chartData: RevenuePoint[] = rows.map((r) => ({ day: r.day, revenue: r.revenue ?? 0, orders: Number(r.orders) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commerce Analytics</h1>
          <p className="text-sm text-muted-foreground">Revenue, orders, and average order value over time.</p>
        </div>
        <div className="flex gap-1 rounded-md border border-border p-1">
          {(Object.keys(RANGES) as RangeKey[]).map((key) => (
            <Link
              key={key}
              href={`/admin/ecommerce/analytics?range=${key}`}
              className={cn("rounded px-3 py-1 text-sm font-medium", range === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
            >
              {RANGES[key].label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Revenue (paid orders)" value={formatCurrency(revenue)} icon={DollarSign} />
        <StatCard label="Orders placed" value={formatNumber(orderCount)} icon={ShoppingCart} />
        <StatCard label="Average order value" value={formatCurrency(aov)} icon={Receipt} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue &amp; orders by day</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
