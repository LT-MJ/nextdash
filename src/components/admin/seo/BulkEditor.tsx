"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ContentWithSeo } from "@/lib/seo/services/content-list";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CONTENT_TYPES: { value: string; label: string }[] = [
  { value: "page", label: "Pages" },
  { value: "post", label: "Blog Posts" },
  { value: "product", label: "Products" },
  { value: "category", label: "Blog Categories" },
  { value: "product_category", label: "Product Categories" },
  { value: "collection", label: "Collections" },
];

type Filter = "all" | "missingTitle" | "missingDescription" | "noindex";

export function BulkEditor() {
  const [entityType, setEntityType] = useState("post");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const { data, mutate, isLoading } = useSWR<{ items: ContentWithSeo[] }>(`/api/admin/seo/bulk-list?entityType=${entityType}`, fetcher);

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    switch (filter) {
      case "missingTitle":
        return items.filter((i) => !i.hasTitle);
      case "missingDescription":
        return items.filter((i) => !i.hasDescription);
      case "noindex":
        return items.filter((i) => !i.robotsIndex);
      default:
        return items;
    }
  }, [data, filter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((i) => i.id))));
  }

  async function applyChange(changes: Record<string, boolean>) {
    if (selected.size === 0) return;
    const res = await fetch("/api/admin/seo/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityIds: [...selected], changes }),
    });
    const body = await res.json();
    setMessage(res.ok ? `Updated ${body.updated} item(s).` : body.error ?? "Bulk update failed.");
    setSelected(new Set());
    mutate();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setSelected(new Set());
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {CONTENT_TYPES.map((ct) => (
            <option key={ct.value} value={ct.value}>
              {ct.label}
            </option>
          ))}
        </select>
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">All</option>
          <option value="missingTitle">Missing SEO title</option>
          <option value="missingDescription">Missing meta description</option>
          <option value="noindex">Noindex</option>
        </select>
      </div>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => applyChange({ robotsIndex: true })}>
            Set indexable
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyChange({ robotsIndex: false })}>
            Set noindex
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyChange({ sitemapInclude: true })}>
            Include in sitemap
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyChange({ sitemapInclude: false })}>
            Exclude from sitemap
          </Button>
        </div>
      ) : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      {!isLoading && filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No items match this filter.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type="checkbox" checked={selected.size > 0 && selected.size === filtered.length} onChange={toggleAll} />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>SEO Score</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Robots</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
                </TableCell>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>{item.seoScore ?? "—"}</TableCell>
                <TableCell>{item.hasTitle ? <Badge variant="success">Set</Badge> : <Badge variant="warning">Missing</Badge>}</TableCell>
                <TableCell>{item.hasDescription ? <Badge variant="success">Set</Badge> : <Badge variant="warning">Missing</Badge>}</TableCell>
                <TableCell>{item.robotsIndex ? <Badge variant="success">Index</Badge> : <Badge variant="destructive">Noindex</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
