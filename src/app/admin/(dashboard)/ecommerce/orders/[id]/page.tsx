import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrderStatusControl } from "@/components/admin/ecommerce/OrderStatusControl";
import { OrderNotesEditor } from "@/components/admin/ecommerce/OrderNotesEditor";
import { getValidNextStatuses, type OrderStatus } from "@/lib/ecommerce/order-state-machine";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Address {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  postalCode: string;
  country: string;
  phone?: string | null;
}

function AddressBlock({ address, title }: { address: Address | null; title: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      {address ? (
        <address className="text-sm not-italic">
          {address.name}
          <br />
          {address.line1}
          {address.line2 ? (
            <>
              <br />
              {address.line2}
            </>
          ) : null}
          <br />
          {address.city}
          {address.region ? `, ${address.region}` : ""} {address.postalCode}
          <br />
          {address.country}
          {address.phone ? (
            <>
              <br />
              {address.phone}
            </>
          ) : null}
        </address>
      ) : (
        <p className="text-sm text-muted-foreground">Not provided.</p>
      )}
    </div>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("ecommerce.orders");
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { customer: true, coupon: true, items: true },
  });
  if (!order) notFound();

  const shippingAddress: Address | null = order.shippingAddress ? JSON.parse(order.shippingAddress) : null;
  const billingAddress: Address | null = order.billingAddress ? JSON.parse(order.billingAddress) : null;
  const validNextStatuses = getValidNextStatuses(order.status) as OrderStatus[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/ecommerce/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed {formatDateTime(order.createdAt)} &middot; Last updated {formatDateTime(order.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderStatusControl orderId={order.id} validNextStatuses={validNextStatuses} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-mono text-xs">{item.sku ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(item.price, order.currency)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.total, order.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal, order.currency)}</span>
              </div>
              {order.discountTotal > 0 ? (
                <div className="flex justify-between text-success">
                  <span>Discount{order.coupon ? ` (${order.coupon.code})` : ""}</span>
                  <span>-{formatCurrency(order.discountTotal, order.currency)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shippingTotal === 0 ? "Free" : formatCurrency(order.shippingTotal, order.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.taxTotal, order.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total, order.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.customer?.name ?? "Guest"}</p>
              <p className="text-muted-foreground">{order.customer?.email ?? "—"}</p>
              {order.customer ? (
                <Link href={`/admin/ecommerce/customers/${order.customer.id}`} className="inline-block pt-1 text-primary hover:underline">
                  View customer
                </Link>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping &amp; Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddressBlock address={shippingAddress} title="Shipping address" />
              <AddressBlock address={billingAddress} title="Billing address" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Internal notes</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderNotesEditor orderId={order.id} initialNotes={order.notes} />
        </CardContent>
      </Card>
    </div>
  );
}
