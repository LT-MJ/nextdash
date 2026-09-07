"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const FIELDS: Array<[string, string]> = [
  ["businessName", "Business name"],
  ["streetAddress", "Street address"],
  ["city", "City"],
  ["region", "Region / State"],
  ["postalCode", "Postal code"],
  ["country", "Country"],
  ["phone", "Phone"],
  ["email", "Email"],
  ["priceRange", "Price range (e.g. $$)"],
  ["website", "Website"],
];

export function LocalSeoSettingsForm() {
  const { data, mutate, isLoading } = useSWR<{ settings: Record<string, unknown> }>("/api/admin/seo/settings?kind=local", fetcher);
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  if (isLoading || !form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/seo/settings?kind=local", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMessage(res.ok ? "Saved." : "Failed to save.");
    mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={Boolean(form.enabled)} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
        Enable Local SEO (generates LocalBusiness structured data)
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={key}>{label}</Label>
            <Input id={key} value={(form[key] as string) ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit">Save settings</Button>
        {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
      </div>
    </form>
  );
}
