"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PageRef {
  id: string;
  title: string;
  slug: string;
}

export function ReadingSettingsForm() {
  const { data, mutate, isLoading } = useSWR<{ settings: Record<string, unknown>; pages: PageRef[] }>("/api/admin/site/reading", fetcher);
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  if (isLoading || !form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const pages = data?.pages ?? [];
  const set = (key: string, value: unknown) => setForm((f) => (f ? { ...f, [key]: value } : f));

  async function handleSave() {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/site/reading", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Failed to save.");
      return;
    }
    setMessage("Saved.");
    mutate();
  }

  const homepageMode = (form.homepageMode as string) ?? "DEFAULT";

  return (
    <div className="max-w-2xl space-y-6">
      <section className="space-y-4 rounded-lg border border-border p-5">
        <h2 className="font-semibold">Homepage</h2>
        <div className="space-y-1.5">
          <Label>Your homepage displays</Label>
          <Select value={homepageMode} onValueChange={(v) => set("homepageMode", v)}>
            <SelectTrigger className="max-w-sm" aria-label="Homepage mode"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DEFAULT">A hero banner (default)</SelectItem>
              <SelectItem value="PAGE">A static page</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {homepageMode === "PAGE" ? (
          <div className="space-y-1.5">
            <Label>Homepage page</Label>
            <Select value={(form.homepagePageId as string) ?? ""} onValueChange={(v) => set("homepagePageId", v)}>
              <SelectTrigger className="max-w-sm" aria-label="Homepage page"><SelectValue placeholder="Select a page…" /></SelectTrigger>
              <SelectContent>
                {pages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {pages.length === 0 ? <p className="text-xs text-muted-foreground">No published pages yet — publish one first.</p> : null}
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-lg border border-border p-5">
        <h2 className="font-semibold">Blog page</h2>
        <div className="space-y-1.5">
          <Label>Intro content shown above the post list</Label>
          <Select value={(form.blogPageId as string) ?? "__none__"} onValueChange={(v) => set("blogPageId", v === "__none__" ? null : v)}>
            <SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None (default)</SelectItem>
              {pages.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">The post grid, search, and category filters stay dynamic — this only replaces the intro heading/text.</p>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave}>Save settings</Button>
        {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </div>
  );
}
