"use client";

import { useState } from "react";
import useSWR from "swr";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface QueueItem {
  id: string;
  url: string;
  action: string;
  status: string;
  response: string | null;
  createdAt: string;
}

export function IndexingQueue() {
  const { data, mutate, isLoading } = useSWR<{ items: QueueItem[]; configured: boolean }>("/api/admin/seo/indexing", fetcher);
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/admin/seo/indexing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: [url] }),
    });
    const body = await res.json();
    setSubmitting(false);
    setMessage(res.ok ? `Submitted (${body.submitted} succeeded, ${body.failed} failed).` : body.error ?? "Failed to submit.");
    setUrl("");
    mutate();
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      {!isLoading && data && !data.configured ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
          INDEXNOW_KEY is not configured — submissions will be queued but will fail until it&apos;s set in the environment.
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/updated-page" required className="max-w-md" />
        <Button type="submit" disabled={submitting}>
          <Send className="h-4 w-4" /> Submit
        </Button>
      </form>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      {!isLoading && items.length === 0 ? (
        <EmptyState title="No URLs submitted for indexing yet." description="Submit a URL above to notify IndexNow-compatible search engines it changed." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-xs truncate font-mono text-xs">{item.url}</TableCell>
                <TableCell>{item.action}</TableCell>
                <TableCell>
                  <Badge variant={item.status === "SUCCESS" ? "success" : item.status === "FAILED" ? "destructive" : "outline"}>{item.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
