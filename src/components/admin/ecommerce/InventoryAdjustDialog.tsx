"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function InventoryAdjustDialog({ inventoryItemId, sku, currentStock }: { inventoryItemId: string; sku: string; currentStock: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState("0");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const deltaNum = Number(delta);
  const resultingStock = currentStock + (Number.isFinite(deltaNum) ? deltaNum : 0);

  async function handleSubmit() {
    setError(null);
    if (!Number.isInteger(deltaNum) || deltaNum === 0) {
      setError("Enter a non-zero whole number.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/ecommerce/inventory/${inventoryItemId}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: deltaNum, reason: reason.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      setDelta("0");
      setReason("");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to adjust inventory.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock — {sku}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Current stock: {currentStock}</p>
          <div className="space-y-1.5">
            <Label htmlFor="delta">Adjustment (use a negative number to remove stock)</Label>
            <Input id="delta" type="number" value={delta} onChange={(e) => setDelta(e.target.value)} />
            <p className="text-xs text-muted-foreground">Resulting stock: {resultingStock}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="e.g. Received shipment, damaged goods, recount…" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : "Save adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
