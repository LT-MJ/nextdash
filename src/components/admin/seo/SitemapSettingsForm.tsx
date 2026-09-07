"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CONTENT_TYPE_LABELS: Record<string, string> = {
  page: "Pages",
  post: "Blog posts",
  product: "Products",
  category: "Blog categories",
  collection: "Collections",
};

export function SitemapSettingsForm() {
  const { data, mutate, isLoading } = useSWR<{ settings: Record<string, unknown>; counts: Record<string, number> }>(
    "/api/admin/seo/settings?kind=sitemap",
    fetcher
  );
  const [toggles, setToggles] = useState<Record<string, boolean> | null>(null);
  const [urlLimit, setUrlLimit] = useState(5000);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data?.settings) {
      const parsed = data.settings.contentTypeToggles ? JSON.parse(data.settings.contentTypeToggles as string) : {};
      setToggles(parsed);
      setUrlLimit((data.settings.urlLimitPerFile as number) ?? 5000);
    }
  }, [data]);

  if (isLoading || !toggles) return <p className="text-sm text-muted-foreground">Loading…</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/seo/settings?kind=sitemap", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentTypeToggles: JSON.stringify(toggles), urlLimitPerFile: urlLimit }),
    });
    setMessage(res.ok ? "Saved." : "Failed to save.");
    mutate();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-border p-5">
        <h2 className="mb-3 font-semibold">Sitemap health</h2>
        <ul className="space-y-2 text-sm">
          {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
            <li key={key} className="flex items-center justify-between">
              <span>{label}</span>
              <Badge variant="outline">{data?.counts?.[key] ?? 0} URLs</Badge>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          View: <a className="text-primary underline" href="/sitemap.xml" target="_blank" rel="noreferrer">/sitemap.xml</a>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border p-5">
        <h2 className="font-semibold">Included content types</h2>
        {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={toggles[key] !== false}
              onChange={(e) => setToggles({ ...toggles, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
        <div className="space-y-1.5">
          <Label htmlFor="urlLimit">URLs per sitemap file (chunking)</Label>
          <Input id="urlLimit" type="number" min={100} max={50000} value={urlLimit} onChange={(e) => setUrlLimit(Number(e.target.value))} />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit">Save settings</Button>
          {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
        </div>
      </form>
    </div>
  );
}
