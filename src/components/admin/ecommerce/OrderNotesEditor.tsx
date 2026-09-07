"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function OrderNotesEditor({ orderId, initialNotes }: { orderId: string; initialNotes: string | null }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSavedMessage(null);
    const res = await fetch(`/api/admin/ecommerce/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notes || null }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedMessage("Saved.");
      router.refresh();
    } else {
      setSavedMessage("Failed to save.");
    }
  }

  return (
    <div className="space-y-2">
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Internal notes about this order…" />
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save notes"}
        </Button>
        {savedMessage ? <span className="text-sm text-muted-foreground">{savedMessage}</span> : null}
      </div>
    </div>
  );
}
