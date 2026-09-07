"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ReviewActions({ reviewId, status }: { reviewId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function updateStatus(next: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/ecommerce/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("Failed to update review.");
  }

  if (status === "APPROVED" || status === "REJECTED") {
    return (
      <div className="flex gap-1">
        {status !== "APPROVED" ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => updateStatus("APPROVED")}>
            Approve
          </Button>
        ) : null}
        {status !== "REJECTED" ? (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => updateStatus("REJECTED")}>
            Reject
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" disabled={busy} onClick={() => updateStatus("APPROVED")}>
        Approve
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => updateStatus("REJECTED")}>
        Reject
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => updateStatus("SPAM")}>
        Spam
      </Button>
    </div>
  );
}
