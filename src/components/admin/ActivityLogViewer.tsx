"use client";

import { useState } from "react";
import useSWR from "swr";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { Activity } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

export function ActivityLogViewer() {
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR<{ entries: ActivityEntry[]; total: number; pageSize: number; entityTypes: string[] }>(
    `/api/admin/activity?page=${page}${entityType ? `&entityType=${entityType}` : ""}`,
    fetcher
  );

  const entries = data?.entries ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All entity types</option>
          {(data?.entityTypes ?? []).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {!isLoading && entries.length === 0 ? (
        <EmptyState icon={Activity} title="No activity recorded yet." description="Changes to SEO metadata, content, and settings will appear here." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs">
                    <Badge variant="outline">{entry.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.entityType}
                    {entry.entityId ? <span className="text-muted-foreground"> · {entry.entityId.slice(0, 8)}</span> : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.user?.name ?? "System"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(entry.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
