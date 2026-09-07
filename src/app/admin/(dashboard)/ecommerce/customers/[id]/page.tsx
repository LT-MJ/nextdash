import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { DollarSign, ShoppingBag, Clock } from "lucide-react";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("ecommerce.customers");
  const { id } = await params;

  const customer = await db.customer.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" } } },
  });
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/ecommerce/customers" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{customer.name ?? customer.email}</h1>
        <p className="text-sm text-muted-foreground">{customer.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lifetime value" value={formatCurrency(customer.totalSpent)} icon={DollarSign} />
        <StatCard label="Orders" value={customer.ordersCount} icon={ShoppingBag} />
        <StatCard label="Last order" value={customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"} icon={Clock} />
      </div>
      <p className="text-xs text-muted-foreground">
        Lifetime value and order count are updated automatically whenever an order transitions to Paid or Refunded (see the order status workflow) rather than
        recomputed on every page load.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.orders.length === 0 ? (
            <EmptyState title="No orders yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/admin/ecommerce/orders/${order.id}`} className="font-medium text-primary hover:underline">
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.paymentStatus} />
                    </TableCell>
                    <TableCell>{formatCurrency(order.total, order.currency)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
