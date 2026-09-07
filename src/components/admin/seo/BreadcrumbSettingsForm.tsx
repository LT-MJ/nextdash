"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function BreadcrumbSettingsForm() {
  const { data, mutate, isLoading } = useSWR<{ settings: Record<string, unknown> }>("/api/admin/seo/settings?kind=breadcrumb", fetcher);
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  if (isLoading || !form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/seo/settings?kind=breadcrumb", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMessage(res.ok ? "Saved." : "Failed to save.");
    mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={Boolean(form.enabled)} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
        Enable breadcrumbs
      </label>
      <div className="space-y-1.5">
        <Label htmlFor="separator">Separator</Label>
        <Input id="separator" value={(form.separator as string) ?? ""} onChange={(e) => setForm({ ...form, separator: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="homeLabel">Home label</Label>
        <Input id="homeLabel" value={(form.homeLabel as string) ?? ""} onChange={(e) => setForm({ ...form, homeLabel: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notFoundLabel">404 label</Label>
        <Input id="notFoundLabel" value={(form.notFoundLabel as string) ?? ""} onChange={(e) => setForm({ ...form, notFoundLabel: e.target.value })} />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit">Save settings</Button>
        {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
      </div>
    </form>
  );
}
