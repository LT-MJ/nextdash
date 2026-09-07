"use client";

import { useState } from "react";
import useSWR from "swr";
import { FileWarning } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NotFoundEntry {
  id: string;
  url: string;
  referrer: string | null;
  hitCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export function NotFoundMonitor() {
  const { data, mutate, isLoading } = useSWR<{ entries: NotFoundEntry[] }>("/api/admin/seo/404-log", fetcher);
  const [creatingRedirectFor, setCreatingRedirectFor] = useState<string | null>(null);
  const [destination, setDestination] = useState("");

  async function patch(id: string, body: Record<string, boolean>) {
    await fetch(`/api/admin/seo/404-log/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    mutate();
  }

  async function createRedirect(source: string) {
    if (!destination) return;
    await fetch("/api/admin/seo/redirects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, destination, statusCode: 301 }),
    });
    const entry = data?.entries.find((e) => e.url === source);
    if (entry) await patch(entry.id, { resolved: true });
    setCreatingRedirectFor(null);
    setDestination("");
    mutate();
  }

  const entries = data?.entries ?? [];

  if (!isLoading && entries.length === 0) {
    return <EmptyState icon={FileWarning} title="No 404 errors recorded." description="Requests to unknown URLs will appear here for triage." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>URL</TableHead>
          <TableHead>Hits</TableHead>
          <TableHead>First seen</TableHead>
          <TableHead>Last seen</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="max-w-xs truncate font-mono text-xs">{entry.url}</TableCell>
            <TableCell>{entry.hitCount}</TableCell>
            <TableCell className="text-muted-foreground">{formatDateTime(entry.firstSeenAt)}</TableCell>
            <TableCell className="text-muted-foreground">{formatDateTime(entry.lastSeenAt)}</TableCell>
            <TableCell>
              {creatingRedirectFor === entry.id ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="/new-destination"
                    className="h-8 w-40 rounded-md border border-input bg-background px-2 text-xs"
                  />
                  <Button size="sm" onClick={() => createRedirect(entry.url)}>
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCreatingRedirectFor(entry.id)}>
                    Create redirect
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => patch(entry.id, { ignored: true })}>
                    Ignore
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => patch(entry.id, { resolved: true })}>
                    Resolve
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
