"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useCart } from "./useCart";
import { formatCurrency } from "@/lib/utils";

interface PricedLine {
  productId: string;
  variantId: string | null;
  found: boolean;
  purchasable: boolean;
  name: string;
  slug: string | null;
  image: string | null;
  price: number;
  quantity: number;
  lineTotal: number;
  availableStock: number;
}

interface PriceResponse {
  lines: PricedLine[];
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
}

export function CartPageClient() {
  const { lines, hydrated, updateQuantity, removeItem } = useCart();
  const [priced, setPriced] = useState<PriceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (lines.length === 0) {
      setPriced({ lines: [], subtotal: 0, shippingTotal: 0, taxTotal: 0, total: 0 });
      return;
    }
    setLoading(true);
    fetch("/api/shop/cart/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lines }),
    })
      .then((res) => res.json())
      .then((data) => setPriced(data))
      .finally(() => setLoading(false));
  }, [hydrated, lines]);

  if (!hydrated || (loading && !priced)) {
    return <p className="text-sm text-muted-foreground">Loading cart…</p>;
  }

  if (!priced || priced.lines.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty."
        description="Browse the shop to add something."
        action={
          <Button asChild size="sm">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        }
      />
    );
  }

  const hasIssues = priced.lines.some((l) => !l.found || !l.purchasable || l.quantity > l.availableStock);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {priced.lines.map((line) => (
          <div key={`${line.productId}-${line.variantId ?? ""}`} className="flex gap-4 rounded-lg border border-border p-4">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              {line.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  {line.slug ? (
                    <Link href={`/shop/${line.slug}`} className="font-medium hover:underline">
                      {line.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{line.name}</span>
                  )}
                  <p className="text-sm text-muted-foreground">{formatCurrency(line.price)} each</p>
                  {!line.found ? <p className="text-sm text-destructive">No longer available.</p> : null}
                  {line.found && !line.purchasable ? <p className="text-sm text-destructive">Currently unavailable.</p> : null}
                  {line.found && line.purchasable && line.quantity > line.availableStock ? (
                    <p className="text-sm text-destructive">Only {line.availableStock} in stock.</p>
                  ) : null}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeItem(line.productId, line.variantId)} aria-label="Remove item">
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center rounded-md border border-input">
                  <Button type="button" variant="ghost" size="icon" onClick={() => updateQuantity(line.productId, line.variantId, line.quantity - 1)} aria-label="Decrease quantity">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center text-sm">{line.quantity}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => updateQuantity(line.productId, line.variantId, line.quantity + 1)} aria-label="Increase quantity">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="font-medium">{formatCurrency(line.lineTotal)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-lg border border-border p-5 lg:sticky lg:top-6 lg:self-start">
        <h2 className="font-semibold">Order summary</h2>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(priced.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated shipping</span>
            <span>{priced.shippingTotal === 0 ? "Free" : formatCurrency(priced.shippingTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated tax</span>
            <span>{formatCurrency(priced.taxTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1 font-semibold">
            <span>Estimated total</span>
            <span>{formatCurrency(priced.total)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Coupons are applied at checkout. Final total is confirmed there.</p>
        {hasIssues ? (
          <Button className="w-full" disabled>
            Proceed to checkout
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href="/shop/checkout">Proceed to checkout</Link>
          </Button>
        )}
        {hasIssues ? <p className="text-xs text-destructive">Resolve the issues above before checking out.</p> : null}
      </div>
    </div>
  );
}
