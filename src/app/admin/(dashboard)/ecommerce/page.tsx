import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Package,
  Users,
  AlertTriangle,
  XCircle,
  Clock,
  Loader,
  CheckCircle2,
  Ban,
  ClipboardList,
  ShoppingBag,
} from "lucide-react";

export default async function EcommerceDashboardPage() {
  await requirePermission("ecommerce.view");

  const [
    revenueAgg,
    ordersCount,
    productsCount,
    customersCount,
    lowStockCount,
    outOfStockCount,
    pendingCount,
    processingCount,
    deliveredCount,
    cancelledCount,
    recentOrders,
    topSellingRaw,
    lowStockItems,
    recentCustomers,
  ] = await Promise.all([
    db.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true }, _count: true }),
    db.order.count(),
    db.product.count(),
    db.customer.count(),
    db.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM "InventoryItem" WHERE "stock" <= "reorderThreshold" AND "stock" > 0`,
    db.inventoryItem.count({ where: { stock: { lte: 0 } } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { status: "PROCESSING" } }),
    db.order.count({ where: { status: "DELIVERED" } }),
    db.order.count({ where: { status: "CANCELLED" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { customer: true } }),
    db.orderItem.groupBy({ by: ["productId"], _sum: { quantity: true }, where: { productId: { not: null } }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    db.inventoryItem.findMany({
      where: { stock: { gt: 0 } },
      include: { product: true, variant: { include: { product: true } } },
      take: 500,
    }),
    db.customer.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const revenue = revenueAgg._sum.total ?? 0;
  const paidOrdersCount = revenueAgg._count;
  const aov = paidOrdersCount > 0 ? revenue / paidOrdersCount : 0;
  const lowStock = Number(lowStockCount[0]?.count ?? 0n);

  const topSellingIds = topSellingRaw.map((r) => r.productId).filter((id): id is string => !!id);
  const topSellingProducts = await db.product.findMany({ where: { id: { in: topSellingIds } } });
  const topSellingMap = new Map(topSellingProducts.map((p) => [p.id, p]));
  const topSelling = topSellingRaw
    .map((r) => ({ product: r.productId ? topSellingMap.get(r.productId) : undefined, quantity: r._sum.quantity ?? 0 }))
    .filter((r) => r.product);

  const lowStockRows = lowStockItems
    .filter((i) => i.stock <= i.reorderThreshold)
    .slice(0, 5)
    .map((i) => ({ id: i.id, name: i.variant ? `${i.variant.product.name} — ${i.variant.name}` : i.product?.name ?? "Unknown", sku: i.sku, stock: i.stock, reorderThreshold: i.reorderThreshold }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commerce Dashboard</h1>
        <p className="text-sm text-muted-foreground">An overview of your store&apos;s health.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(revenue)} icon={DollarSign} tone="success" />
        <StatCard label="Orders" value={ordersCount} icon={ShoppingCart} />
        <StatCard label="Avg. Order Value" value={formatCurrency(aov)} icon={Receipt} />
        <StatCard label="Products" value={productsCount} icon={Package} />
        <StatCard label="Customers" value={customersCount} icon={Users} />
        <StatCard label="Low Stock" value={lowStock} icon={AlertTriangle} tone={lowStock > 0 ? "warning" : "default"} />
        <StatCard label="Out of Stock" value={outOfStockCount} icon={XCircle} tone={outOfStockCount > 0 ? "destructive" : "default"} />
        <StatCard label="Pending Orders" value={pendingCount} icon={Clock} tone={pendingCount > 0 ? "warning" : "default"} />
        <StatCard label="Processing Orders" value={processingCount} icon={Loader} />
        <StatCard label="Delivered Orders" value={deliveredCount} icon={CheckCircle2} tone="success" />
        <StatCard label="Cancelled Orders" value={cancelledCount} icon={Ban} tone={cancelledCount > 0 ? "destructive" : "default"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No orders have been placed yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={`/admin/ecommerce/orders/${order.id}`} className="font-medium text-primary hover:underline">
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{order.customer?.email ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>{formatCurrency(order.total, order.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top-selling products</CardTitle>
          </CardHeader>
          <CardContent>
            {topSelling.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="No sales yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Units sold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSelling.map(({ product, quantity }) => (
                    <TableRow key={product!.id}>
                      <TableCell>
                        <Link href={`/admin/ecommerce/products/${product!.id}`} className="font-medium text-primary hover:underline">
                          {product!.name}
                        </Link>
                      </TableCell>
                      <TableCell>{quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockRows.length === 0 ? (
              <EmptyState title="Nothing is low on stock right now." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Reorder at</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.stock}</TableCell>
                      <TableCell>{row.reorderThreshold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Link href="/admin/ecommerce/inventory" className="mt-3 inline-block text-sm text-primary hover:underline">
              View all inventory →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent customers</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCustomers.length === 0 ? (
              <EmptyState icon={Users} title="No customers yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Link href={`/admin/ecommerce/customers/${customer.id}`} className="font-medium text-primary hover:underline">
                          {customer.name ?? customer.email}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(customer.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
