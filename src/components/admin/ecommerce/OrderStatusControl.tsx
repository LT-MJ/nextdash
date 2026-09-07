"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/ecommerce/order-state-machine";

export function OrderStatusControl({ orderId, validNextStatuses }: { orderId: string; validNextStatuses: OrderStatus[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<OrderStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (validNextStatuses.length === 0) {
    return <p className="text-sm text-muted-foreground">This order is in a final state — no further transitions are available.</p>;
  }

  async function handleSubmit() {
    if (!target) return;
    setError(null);
    setSaving(true);
    const res = await fetch(`/api/admin/ecommerce/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: target }),
    });
    setSaving(false);
    if (res.ok) {
      setTarget("");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to update status.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm" value={target} onChange={(e) => setTarget(e.target.value as OrderStatus)}>
        <option value="">Move to…</option>
        {validNextStatuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <Button size="sm" onClick={handleSubmit} disabled={!target || saving}>
        {saving ? "Updating…" : "Update status"}
      </Button>
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </div>
  );
}
