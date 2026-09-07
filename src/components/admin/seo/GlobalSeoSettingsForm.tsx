"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function GlobalSeoSettingsForm() {
  const { data, mutate, isLoading } = useSWR<{ settings: Record<string, unknown> }>("/api/admin/seo/settings?kind=global", fetcher);
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  if (isLoading || !form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/seo/settings?kind=global", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMessage(res.ok ? "Saved." : "Failed to save.");
    mutate();
  }

  const set = (key: string, value: unknown) => setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <section className="space-y-4 rounded-lg border border-border p-5">
        <h2 className="font-semibold">Website identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="siteName">Website name</Label>
            <Input id="siteName" value={(form.siteName as string) ?? ""} onChange={(e) => set("siteName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="siteUrl">Website URL</Label>
            <Input id="siteUrl" value={(form.siteUrl as string) ?? ""} onChange={(e) => set("siteUrl", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="orgName">Organization name</Label>
            <Input id="orgName" value={(form.orgName as string) ?? ""} onChange={(e) => set("orgName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="orgLogo">Organization logo URL</Label>
            <Input id="orgLogo" value={(form.orgLogo as string) ?? ""} onChange={(e) => set("orgLogo", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input id="contactEmail" value={(form.contactEmail as string) ?? ""} onChange={(e) => set("contactEmail", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input id="contactPhone" value={(form.contactPhone as string) ?? ""} onChange={(e) => set("contactPhone", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="orgDescription">Organization description</Label>
          <Textarea id="orgDescription" value={(form.orgDescription as string) ?? ""} onChange={(e) => set("orgDescription", e.target.value)} rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="defaultSocialImage">Default social share image URL</Label>
          <Input id="defaultSocialImage" value={(form.defaultSocialImage as string) ?? ""} onChange={(e) => set("defaultSocialImage", e.target.value)} />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border p-5">
        <h2 className="font-semibold">Global defaults</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="titleSeparator">Title separator</Label>
            <Input id="titleSeparator" value={(form.titleSeparator as string) ?? ""} onChange={(e) => set("titleSeparator", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="defaultTitleTemplate">Default title template</Label>
          <Input id="defaultTitleTemplate" value={(form.defaultTitleTemplate as string) ?? ""} onChange={(e) => set("defaultTitleTemplate", e.target.value)} />
          <p className="text-xs text-muted-foreground">Variables: {"{title} {siteName} {sep} {category} {author} {date} {excerpt} {focusKeyword}"}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="defaultDescriptionTemplate">Default description template</Label>
          <Textarea
            id="defaultDescriptionTemplate"
            value={(form.defaultDescriptionTemplate as string) ?? ""}
            onChange={(e) => set("defaultDescriptionTemplate", e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(form.defaultRobotsIndex)} onChange={(e) => set("defaultRobotsIndex", e.target.checked)} />
            Index by default
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(form.defaultRobotsFollow)} onChange={(e) => set("defaultRobotsFollow", e.target.checked)} />
            Follow by default
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit">Save settings</Button>
        {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
      </div>
    </form>
  );
}
