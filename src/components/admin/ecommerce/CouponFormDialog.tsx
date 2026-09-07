"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export interface CouponFormInitial {
  id: string;
  code: string;
  type: string;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  active: boolean;
}

function toDateInputValue(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function CouponFormDialog({ initial, trigger }: { initial?: CouponFormInitial; trigger: React.ReactNode }) {
  const router = useRouter();
  const isEdit = !!initial;
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(initial?.code ?? "");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">((initial?.type as "PERCENTAGE" | "FIXED") ?? "PERCENTAGE");
  const [value, setValue] = useState(initial ? String(initial.value) : "10");
  const [minPurchase, setMinPurchase] = useState(initial?.minPurchase != null ? String(initial.minPurchase) : "");
  const [maxDiscount, setMaxDiscount] = useState(initial?.maxDiscount != null ? String(initial.maxDiscount) : "");
  const [usageLimit, setUsageLimit] = useState(initial?.usageLimit != null ? String(initial.usageLimit) : "");
  const [perCustomerLimit, setPerCustomerLimit] = useState(initial?.perCustomerLimit != null ? String(initial.perCustomerLimit) : "");
  const [startsAt, setStartsAt] = useState(toDateInputValue(initial?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDateInputValue(initial?.endsAt ?? null));
  const [active, setActive] = useState(initial?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    if (!code.trim()) return setError("Code is required.");
    const numValue = Number(value);
    if (!Number.isFinite(numValue) || numValue < 0) return setError("Value must be zero or more.");

    const payload = {
      code: code.trim(),
      type,
      value: numValue,
      minPurchase: minPurchase ? Number(minPurchase) : null,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perCustomerLimit: perCustomerLimit ? Number(perCustomerLimit) : null,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      active,
      productRestrictions: [],
      categoryRestrictions: [],
    };

    setSaving(true);
    const res = await fetch(isEdit ? `/api/admin/ecommerce/coupons/${initial!.id}` : "/api/admin/ecommerce/coupons", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save coupon.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit coupon" : "New coupon"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="coupon-code">Code</Label>
            <Input id="coupon-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-type">Type</Label>
              <select id="coupon-type" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm" value={type} onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FIXED")}>
                <option value="PERCENTAGE">Percentage off</option>
                <option value="FIXED">Fixed amount off</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-value">Value {type === "PERCENTAGE" ? "(%)" : "($)"}</Label>
              <Input id="coupon-value" type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-min">Minimum purchase</Label>
              <Input id="coupon-min" type="number" min="0" step="0.01" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} placeholder="None" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-max">Max discount</Label>
              <Input id="coupon-max" type="number" min="0" step="0.01" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="No cap" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-usage">Usage limit (total)</Label>
              <Input id="coupon-usage" type="number" min="0" step="1" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-per-customer">Limit per customer</Label>
              <Input id="coupon-per-customer" type="number" min="0" step="1" value={perCustomerLimit} onChange={(e) => setPerCustomerLimit(e.target.value)} placeholder="Unlimited" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-starts">Starts</Label>
              <Input id="coupon-starts" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-ends">Ends</Label>
              <Input id="coupon-ends" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-input" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
