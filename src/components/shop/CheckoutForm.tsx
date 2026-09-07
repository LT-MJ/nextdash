"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useCart } from "./useCart";
import { formatCurrency } from "@/lib/utils";

interface PricedLine {
  productId: string;
  variantId: string | null;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
  purchasable: boolean;
  availableStock: number;
}

interface PriceResponse {
  lines: PricedLine[];
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
}

interface AddressForm {
  name: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
}

function emptyAddress(): AddressForm {
  return { name: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "", phone: "" };
}

export function CheckoutForm() {
  const router = useRouter();
  const { lines, hydrated, clearCart } = useCart();
  const [priced, setPriced] = useState<PriceResponse | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [shipping, setShipping] = useState<AddressForm>(emptyAddress());
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billing, setBilling] = useState<AddressForm>(emptyAddress());
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    fetch("/api/shop/cart/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lines }),
    })
      .then((res) => res.json())
      .then(setPriced);
  }, [hydrated, lines]);

  if (hydrated && lines.length === 0) {
    return <EmptyState title="Your cart is empty." description="Add something to your cart before checking out." />;
  }

  function updateAddress(setter: (fn: (a: AddressForm) => AddressForm) => void, field: keyof AddressForm, value: string) {
    setter((a) => ({ ...a, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !name.trim()) return setError("Name and email are required.");
    if (!shipping.name || !shipping.line1 || !shipping.city || !shipping.postalCode || !shipping.country) {
      return setError("Please complete the shipping address.");
    }

    setSubmitting(true);
    const res = await fetch("/api/shop/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: lines,
        customerEmail: email.trim(),
        customerName: name.trim(),
        shippingAddress: {
          name: shipping.name,
          line1: shipping.line1,
          line2: shipping.line2 || null,
          city: shipping.city,
          region: shipping.region || null,
          postalCode: shipping.postalCode,
          country: shipping.country,
          phone: shipping.phone || null,
        },
        billingAddress: billingSameAsShipping
          ? null
          : {
              name: billing.name,
              line1: billing.line1,
              line2: billing.line2 || null,
              city: billing.city,
              region: billing.region || null,
              postalCode: billing.postalCode,
              country: billing.country,
              phone: billing.phone || null,
            },
        couponCode: couponCode.trim() || null,
      }),
    });
    setSubmitting(false);

    if (res.ok) {
      const body = await res.json();
      clearCart();
      router.push(`/shop/order/${body.order.orderNumber}/confirmation`);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to place order.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="space-y-3">
          <h2 className="font-semibold">Contact information</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="checkout-name">Full name</Label>
              <Input id="checkout-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkout-email">Email</Label>
              <Input id="checkout-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Shipping address</h2>
          <AddressFields value={shipping} onChange={(field, val) => updateAddress(setShipping, field, val)} />
        </section>

        <section className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-input" checked={billingSameAsShipping} onChange={(e) => setBillingSameAsShipping(e.target.checked)} />
            Billing address same as shipping
          </label>
          {!billingSameAsShipping ? (
            <>
              <h2 className="font-semibold">Billing address</h2>
              <AddressFields value={billing} onChange={(field, val) => updateAddress(setBilling, field, val)} />
            </>
          ) : null}
        </section>

        <section className="space-y-1.5">
          <Label htmlFor="checkout-coupon">Coupon code (optional)</Label>
          <Input id="checkout-coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="e.g. SUMMER20" className="max-w-xs" />
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" disabled={submitting || !priced} size="lg">
          {submitting ? "Placing order…" : "Place order"}
        </Button>
        <p className="text-xs text-muted-foreground">
          No payment is collected online. This is a manual/invoice-style order — we&apos;ll confirm and arrange payment by email.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-5 lg:sticky lg:top-6 lg:self-start">
        <h2 className="font-semibold">Order summary</h2>
        {priced ? (
          <>
            <div className="space-y-2 text-sm">
              {priced.lines.map((l) => (
                <div key={`${l.productId}-${l.variantId ?? ""}`} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {l.name} × {l.quantity}
                  </span>
                  <span>{formatCurrency(l.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-border pt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(priced.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{priced.shippingTotal === 0 ? "Free" : formatCurrency(priced.shippingTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(priced.taxTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 font-semibold">
                <span>Total{couponCode ? " (before coupon)" : ""}</span>
                <span>{formatCurrency(priced.total)}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
      </div>
    </form>
  );
}

function AddressFields({ value, onChange }: { value: AddressForm; onChange: (field: keyof AddressForm, val: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Full name</Label>
        <Input value={value.name} onChange={(e) => onChange("name", e.target.value)} required />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Address line 1</Label>
        <Input value={value.line1} onChange={(e) => onChange("line1", e.target.value)} required />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Address line 2</Label>
        <Input value={value.line2} onChange={(e) => onChange("line2", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>City</Label>
        <Input value={value.city} onChange={(e) => onChange("city", e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>State / Region</Label>
        <Input value={value.region} onChange={(e) => onChange("region", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Postal code</Label>
        <Input value={value.postalCode} onChange={(e) => onChange("postalCode", e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>Country</Label>
        <Input value={value.country} onChange={(e) => onChange("country", e.target.value)} required />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Phone (optional)</Label>
        <Input value={value.phone} onChange={(e) => onChange("phone", e.target.value)} />
      </div>
    </div>
  );
}
