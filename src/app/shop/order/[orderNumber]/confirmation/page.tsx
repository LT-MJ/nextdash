import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/lib/server/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order Confirmation",
  description: "Your order has been received.",
};

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true, customer: true },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <h1 className="text-2xl font-bold tracking-tight">Thanks for your order!</h1>
        <p className="text-muted-foreground">
          Order <span className="font-mono font-medium text-foreground">{order.orderNumber}</span> was received on {formatDateTime(order.createdAt)}.
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          This is a manual/invoice-style order — no payment was collected online. We&apos;ll confirm your order and arrange payment by email to{" "}
          <span className="font-medium">{order.customer?.email}</span>.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
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
            <span>Discount</span>
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

      <div className="mt-8 text-center">
        <Button asChild variant="outline">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
