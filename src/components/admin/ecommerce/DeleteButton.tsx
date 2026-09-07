"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({ url, confirmText, onDeleted }: { url: string; confirmText: string; onDeleted?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!confirm(confirmText)) return;
    setBusy(true);
    const res = await fetch(url, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      if (onDeleted) onDeleted();
      else router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Failed to delete.");
    }
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Delete" disabled={busy} onClick={handleClick}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
