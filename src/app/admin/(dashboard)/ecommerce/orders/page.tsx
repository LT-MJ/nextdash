import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListFilters } from "@/components/admin/ecommerce/ListFilters";
import { Pagination } from "@/components/admin/ecommerce/Pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; paymentStatus?: string; search?: string }>;
}) {
  await requirePermission("ecommerce.orders");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const status = sp.status;
  const paymentStatus = sp.paymentStatus;
  const search = sp.search?.trim();

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(search ? { OR: [{ orderNumber: { contains: search } }, { customer: { email: { contains: search } } }] } : {}),
  };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">Track and fulfill customer orders.</p>
      </div>

      <ListFilters
        searchPlaceholder="Search by order number or email…"
        selects={[
          {
            key: "status",
            label: "Status",
            options: ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map((s) => ({ value: s, label: s })),
          },
          {
            key: "paymentStatus",
            label: "Payment",
            options: ["UNPAID", "PAID", "REFUNDED", "FAILED"].map((s) => ({ value: s, label: s })),
          },
        ]}
      />

      {orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders have been placed yet." description="Orders placed through the storefront checkout will appear here." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/admin/ecommerce/orders/${order.id}`} className="font-medium text-primary hover:underline">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p>{order.customer?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{order.customer?.email}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.paymentStatus} />
                  </TableCell>
                  <TableCell>{formatCurrency(order.total, order.currency)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/ecommerce/orders" searchParams={{ status, paymentStatus, search }} />
        </>
      )}
    </div>
  );
}
