"use client";

import { useState } from "react";
import useSWR from "swr";
import { History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Revision {
  id: string;
  createdAt: string;
  changedFields: string[];
  authorName: string;
}

export function RevisionsPanel({ postId }: { postId: string }) {
  const { data, isLoading, mutate } = useSWR<{ revisions: Revision[] }>(`/api/admin/blog/posts/${postId}/revisions`, fetcher);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRestore() {
    if (!confirmId) return;
    setRestoring(true);
    setError(null);
    const res = await fetch(`/api/admin/blog/posts/${postId}/revisions/${confirmId}/restore`, { method: "POST" });
    setRestoring(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to restore revision.");
      return;
    }
    setConfirmId(null);
    await mutate();
    // The Content tab holds its own local state seeded from server props on
    // mount — reload so every field reflects the just-restored values.
    window.location.reload();
  }

  const revisions = data?.revisions ?? [];

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading revision history…</p>
      ) : revisions.length === 0 ? (
        <EmptyState icon={History} title="No revisions yet." description="A revision is recorded automatically every time you save changes to this post." />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {revisions.map((rev) => (
            <li key={rev.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">{formatDateTime(rev.createdAt)}</p>
                <p className="text-xs text-muted-foreground">by {rev.authorName}</p>
                {rev.changedFields.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {rev.changedFields.map((f) => (
                      <Badge key={f} variant="outline" className="text-[10px]">
                        {f}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
              <Button size="sm" variant="outline" onClick={() => setConfirmId(rev.id)}>
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Dialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore this revision?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This overwrites the post&apos;s current content and metadata with this earlier version. The current state is saved as a new revision first, so this can be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={restoring}>
              {restoring ? "Restoring…" : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
