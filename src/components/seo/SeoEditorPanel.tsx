"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchPreview } from "./SearchPreview";
import { SocialPreview } from "./SocialPreview";
import { SeoScoreRing, SeoRuleResultRow } from "./SeoScore";
import { analyzeSeo } from "@/lib/seo/scoring";
import type { ContentTypeKey, SeoAnalysisInput, SeoAnalysisResult } from "@/types/seo";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SeoEditorPanelProps {
  entityType: ContentTypeKey;
  entityId: string;
}

interface FormState {
  title: string;
  description: string;
  focusKeyword: string;
  additionalKeywords: string;
  canonicalUrl: string;
  canonicalMode: "AUTO" | "CUSTOM";
  robotsIndex: boolean;
  robotsFollow: boolean;
  robotsNoarchive: boolean;
  robotsNosnippet: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterCard: "summary" | "summary_large_image";
  sitemapInclude: boolean;
  breadcrumbLabel: string;
}

function toFormState(seoMetadata: Record<string, unknown> | null): FormState {
  const m = seoMetadata ?? {};
  return {
    title: (m.title as string) ?? "",
    description: (m.description as string) ?? "",
    focusKeyword: (m.focusKeyword as string) ?? "",
    additionalKeywords: Array.isArray(m.additionalKeywords) ? (m.additionalKeywords as string[]).join(", ") : "",
    canonicalUrl: (m.canonicalUrl as string) ?? "",
    canonicalMode: (m.canonicalMode as "AUTO" | "CUSTOM") ?? "AUTO",
    robotsIndex: (m.robotsIndex as boolean) ?? true,
    robotsFollow: (m.robotsFollow as boolean) ?? true,
    robotsNoarchive: (m.robotsNoarchive as boolean) ?? false,
    robotsNosnippet: (m.robotsNosnippet as boolean) ?? false,
    ogTitle: (m.ogTitle as string) ?? "",
    ogDescription: (m.ogDescription as string) ?? "",
    ogImage: (m.ogImage as string) ?? "",
    twitterTitle: (m.twitterTitle as string) ?? "",
    twitterDescription: (m.twitterDescription as string) ?? "",
    twitterImage: (m.twitterImage as string) ?? "",
    twitterCard: (m.twitterCard as "summary" | "summary_large_image") ?? "summary_large_image",
    sitemapInclude: (m.sitemapInclude as boolean) ?? true,
    breadcrumbLabel: (m.breadcrumbLabel as string) ?? "",
  };
}

export function SeoEditorPanel({ entityType, entityId }: SeoEditorPanelProps) {
  const { data, isLoading, mutate } = useSWR<{
    title: string | null;
    path: string | null;
    slug: string | null;
    seoMetadata: Record<string, unknown> | null;
    analysis: SeoAnalysisResult;
    siteUrl: string;
  }>(`/api/admin/seo/content/${entityType}/${entityId}`, fetcher);

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm(toFormState(data.seoMetadata));
  }, [data]);

  const liveAnalysis = useMemo(() => {
    if (!form || !data) return data?.analysis ?? null;
    const input: SeoAnalysisInput = {
      entityType,
      entityId,
      url: data.path ?? "",
      slug: data.slug ?? "",
      seoTitle: form.title || null,
      metaDescription: form.description || null,
      focusKeyword: form.focusKeyword || null,
      additionalKeywords: form.additionalKeywords.split(",").map((k) => k.trim()).filter(Boolean),
      contentHtml: "", // recomputed authoritatively server-side; client preview covers metadata-only rules
      robotsIndex: form.robotsIndex,
      canonicalUrl: form.canonicalMode === "CUSTOM" ? form.canonicalUrl || null : data.path,
      schemaType: null,
      hasCustomSchema: false,
      sitemapInclude: form.sitemapInclude,
    };
    return analyzeSeo(input);
  }, [form, data, entityType, entityId]);

  if (isLoading || !form || !data) {
    return <div className="animate-pulse rounded-lg border border-border bg-muted/30 p-8 text-sm text-muted-foreground">Loading SEO data…</div>;
  }

  const siteUrl = data.siteUrl?.replace(/\/$/, "") ?? "";
  const displayTitle = form.title || data.title || "";
  const previewUrl = `${siteUrl}${data.path ?? ""}`;

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setSaveMessage(null);
    const payload = {
      ...form,
      additionalKeywords: form.additionalKeywords.split(",").map((k) => k.trim()).filter(Boolean),
      canonicalUrl: form.canonicalUrl || null,
      ogImage: form.ogImage || null,
      twitterImage: form.twitterImage || null,
    };
    const res = await fetch(`/api/admin/seo/content/${entityType}/${entityId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMessage("Saved.");
      mutate();
    } else {
      const body = await res.json().catch(() => ({}));
      setSaveMessage(body.error ?? "Failed to save.");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">Basic SEO</TabsTrigger>
            <TabsTrigger value="preview">Search Preview</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="focusKeyword">Focus keyword</Label>
              <Input id="focusKeyword" value={form.focusKeyword} onChange={(e) => setForm({ ...form, focusKeyword: e.target.value })} placeholder="e.g. ergonomic office chair" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="additionalKeywords">Additional keywords (comma-separated)</Label>
              <Input id="additionalKeywords" value={form.additionalKeywords} onChange={(e) => setForm({ ...form, additionalKeywords: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">SEO title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} />
              <p className="text-xs text-muted-foreground">{form.title.length}/60 recommended characters</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Meta description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={320} rows={3} />
              <p className="text-xs text-muted-foreground">{form.description.length}/160 recommended characters</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="canonicalUrl">Canonical URL override</Label>
              <Input
                id="canonicalUrl"
                value={form.canonicalUrl}
                onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value, canonicalMode: e.target.value ? "CUSTOM" : "AUTO" })}
                placeholder={previewUrl}
              />
              <p className="text-xs text-muted-foreground">Leave blank to use the automatically computed canonical: {previewUrl}</p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <SearchPreview title={displayTitle} description={form.description || null} url={previewUrl} />
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ogTitle">Open Graph title</Label>
                <Input id="ogTitle" value={form.ogTitle} onChange={(e) => setForm({ ...form, ogTitle: e.target.value })} placeholder={displayTitle} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ogImage">Open Graph image URL</Label>
                <Input id="ogImage" value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ogDescription">Open Graph description</Label>
              <Textarea id="ogDescription" value={form.ogDescription} onChange={(e) => setForm({ ...form, ogDescription: e.target.value })} rows={2} placeholder={form.description} />
            </div>
            <SocialPreview title={form.ogTitle || displayTitle} description={form.ogDescription || form.description || null} image={form.ogImage || null} siteName={siteUrl} variant="facebook" />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="twitterTitle">Twitter/X title</Label>
                <Input id="twitterTitle" value={form.twitterTitle} onChange={(e) => setForm({ ...form, twitterTitle: e.target.value })} placeholder={displayTitle} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="twitterImage">Twitter/X image URL</Label>
                <Input id="twitterImage" value={form.twitterImage} onChange={(e) => setForm({ ...form, twitterImage: e.target.value })} />
              </div>
            </div>
            <SocialPreview title={form.twitterTitle || displayTitle} description={form.twitterDescription || form.description || null} image={form.twitterImage || form.ogImage || null} siteName={siteUrl} variant="twitter" />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Robots directives</legend>
              {(
                [
                  ["robotsIndex", "Index (uncheck for noindex)"],
                  ["robotsFollow", "Follow (uncheck for nofollow)"],
                  ["robotsNoarchive", "No archive"],
                  ["robotsNosnippet", "No snippet"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.sitemapInclude} onChange={(e) => setForm({ ...form, sitemapInclude: e.target.checked })} className="h-4 w-4 rounded border-input" />
              Include in XML sitemap
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="breadcrumbLabel">Breadcrumb label override</Label>
              <Input id="breadcrumbLabel" value={form.breadcrumbLabel} onChange={(e) => setForm({ ...form, breadcrumbLabel: e.target.value })} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save SEO settings"}
          </Button>
          {saveMessage ? <span className="text-sm text-muted-foreground">{saveMessage}</span> : null}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-5">
          <SeoScoreRing score={liveAnalysis?.score ?? null} grade={liveAnalysis?.grade ?? null} />
          <p className="text-center text-xs text-muted-foreground">
            Metadata rules update live; content-structure rules (links, headings, images) reflect the last saved analysis.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-sm font-semibold">Checklist</p>
          <ul className="max-h-96 overflow-y-auto scrollbar-thin">
            {(liveAnalysis?.results ?? [])
              .filter((r) => r.status !== "NOT_APPLICABLE")
              .sort((a, b) => (a.status === "FAIL" ? -1 : b.status === "FAIL" ? 1 : 0))
              .map((result) => (
                <SeoRuleResultRow key={result.rule} result={result} />
              ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
