"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRightLeft } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface RedirectRow {
  id: string;
  source: string;
  destination: string;
  statusCode: number;
  enabled: boolean;
  hitCount: number;
  lastHitAt: string | null;
  notes: string | null;
}

export function RedirectsManager() {
  const { data, mutate, isLoading } = useSWR<{ redirects: RedirectRow[] }>("/api/admin/seo/redirects", fetcher);
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [statusCode, setStatusCode] = useState(301);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWarning(null);
    const res = await fetch("/api/admin/seo/redirects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, destination, statusCode }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Failed to create redirect.");
      return;
    }
    if (body.warning) setWarning(body.warning);
    setSource("");
    setDestination("");
    mutate();
    if (!body.warning) setOpen(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/seo/redirects/${id}`, { method: "DELETE" });
    mutate();
  }

  async function handleToggle(id: string, enabled: boolean) {
    await fetch(`/api/admin/seo/redirects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    mutate();
  }

  const redirects = data?.redirects ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New redirect
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create redirect</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="source">Source path</Label>
                <Input id="source" required value={source} onChange={(e) => setSource(e.target.value)} placeholder="/old-page" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="destination">Destination</Label>
                <Input id="destination" required value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="/new-page" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="statusCode">Status code</Label>
                <select
                  id="statusCode"
                  value={statusCode}
                  onChange={(e) => setStatusCode(Number(e.target.value))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {[301, 302, 303, 307, 308].map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {warning ? <p className="text-sm text-warning-foreground">{warning}</p> : null}
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!isLoading && redirects.length === 0 ? (
        <EmptyState icon={ArrowRightLeft} title="No redirects configured." description="Create a redirect to send visitors from an old URL to a new one." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hits</TableHead>
              <TableHead>Last hit</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {redirects.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="max-w-xs truncate font-mono text-xs">{r.source}</TableCell>
                <TableCell className="max-w-xs truncate font-mono text-xs">{r.destination}</TableCell>
                <TableCell>
                  <Badge variant="outline">{r.statusCode}</Badge>
                </TableCell>
                <TableCell>{r.hitCount}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(r.lastHitAt)}</TableCell>
                <TableCell>
                  <button
                    onClick={() => handleToggle(r.id, !r.enabled)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.enabled ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                  >
                    {r.enabled ? "Enabled" : "Disabled"}
                  </button>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" aria-label="Delete redirect" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
