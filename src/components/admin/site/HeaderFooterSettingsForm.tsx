"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { parseFooterColumns, parseSocialLinks } from "@/lib/site/types";
import type { FooterColumn, SocialLink } from "@/lib/site/validation";
import { HEADER_LAYOUTS } from "@/lib/site/validation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface MenuRef {
  id: string;
  name: string;
}

interface FormState {
  logoImageUrl: string;
  logoAltText: string;
  logoText: string;
  headerLayout: string;
  headerSticky: boolean;
  primaryMenuId: string | null;
  footerColumns: FooterColumn[];
  socialLinks: SocialLink[];
  copyrightText: string;
}

const LAYOUT_LABELS: Record<string, string> = {
  "logo-left-nav-right": "Logo left, nav right",
  centered: "Centered",
  "logo-center-nav-below": "Logo centered, nav below",
};

export function HeaderFooterSettingsForm() {
  const { data, mutate, isLoading } = useSWR<{ settings: Record<string, unknown>; menus: MenuRef[] }>("/api/admin/site/header-footer", fetcher);
  const [form, setForm] = useState<FormState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.settings) return;
    const s = data.settings;
    setForm({
      logoImageUrl: (s.logoImageUrl as string) ?? "",
      logoAltText: (s.logoAltText as string) ?? "",
      logoText: (s.logoText as string) ?? "",
      headerLayout: (s.headerLayout as string) ?? "logo-left-nav-right",
      headerSticky: Boolean(s.headerSticky),
      primaryMenuId: (s.primaryMenuId as string) ?? null,
      footerColumns: parseFooterColumns(s.footerColumns as string | null),
      socialLinks: parseSocialLinks(s.socialLinks as string | null),
      copyrightText: (s.copyrightText as string) ?? "© {year} {siteName}. All rights reserved.",
    });
  }, [data]);

  if (isLoading || !form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const menus = data?.menus ?? [];
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  async function handleSave() {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/site/header-footer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Failed to save.");
      return;
    }
    setMessage("Saved.");
    mutate();
  }

  const currentForm = form;

  const addFooterColumn = () => {
    if (currentForm.footerColumns.length >= 6) return;
    set("footerColumns", [...currentForm.footerColumns, { heading: "New column", menuId: null, links: [] }]);
  };

  const updateFooterColumn = (index: number, next: FooterColumn) => {
    set("footerColumns", currentForm.footerColumns.map((c, i) => (i === index ? next : c)));
  };

  const removeFooterColumn = (index: number) => {
    set("footerColumns", currentForm.footerColumns.filter((_, i) => i !== index));
  };

  const addSocialLink = () => {
    if (currentForm.socialLinks.length >= 10) return;
    set("socialLinks", [...currentForm.socialLinks, { platform: "Twitter", url: "" }]);
  };

  const updateSocialLink = (index: number, next: SocialLink) => {
    set("socialLinks", currentForm.socialLinks.map((l, i) => (i === index ? next : l)));
  };

  const removeSocialLink = (index: number) => {
    set("socialLinks", currentForm.socialLinks.filter((_, i) => i !== index));
  };

  const year = new Date().getFullYear();
  const copyrightPreview = form.copyrightText.replace("{year}", String(year)).replace("{siteName}", "Your Site");

  return (
    <div className="max-w-2xl space-y-6">
      <Tabs defaultValue="header">
        <TabsList>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Logo image URL</Label>
              <Input value={form.logoImageUrl} onChange={(e) => set("logoImageUrl", e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label>Logo alt text</Label>
              <Input value={form.logoAltText} onChange={(e) => set("logoAltText", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Logo text (fallback if no image)</Label>
              <Input value={form.logoText} onChange={(e) => set("logoText", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Layout</Label>
              <Select value={form.headerLayout} onValueChange={(v) => set("headerLayout", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HEADER_LAYOUTS.map((layout) => (
                    <SelectItem key={layout} value={layout}>{LAYOUT_LABELS[layout]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Primary menu</Label>
              <Select value={form.primaryMenuId ?? "__none__"} onValueChange={(v) => set("primaryMenuId", v === "__none__" ? null : v)}>
                <SelectTrigger aria-label="Primary menu"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {menus.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {menus.length === 0 ? <p className="text-xs text-muted-foreground">Create a menu first under Content → Menus.</p> : null}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.headerSticky} onCheckedChange={(checked) => set("headerSticky", checked)} />
            Sticky header (stays visible when scrolling)
          </label>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4">
          {form.footerColumns.map((column, index) => (
            <FooterColumnEditor
              key={index}
              column={column}
              menus={menus}
              onChange={(next) => updateFooterColumn(index, next)}
              onRemove={() => removeFooterColumn(index)}
            />
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addFooterColumn} disabled={form.footerColumns.length >= 6}>
            <Plus className="h-4 w-4" /> Add column
          </Button>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          {form.socialLinks.map((link, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="w-36 space-y-1.5">
                <Label>Platform</Label>
                <Input value={link.platform} onChange={(e) => updateSocialLink(index, { ...link, platform: e.target.value })} />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>URL</Label>
                <Input value={link.url} onChange={(e) => updateSocialLink(index, { ...link, url: e.target.value })} placeholder="https://…" />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(index)} aria-label="Remove social link">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addSocialLink} disabled={form.socialLinks.length >= 10}>
            <Plus className="h-4 w-4" /> Add social link
          </Button>

          <div className="space-y-1.5 border-t border-border pt-4">
            <Label>Copyright text</Label>
            <Input value={form.copyrightText} onChange={(e) => set("copyrightText", e.target.value)} />
            <p className="text-xs text-muted-foreground">Variables: {"{year} {siteName}"} — preview: &ldquo;{copyrightPreview}&rdquo;</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button onClick={handleSave}>Save settings</Button>
        {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </div>
  );
}

function FooterColumnEditor({
  column,
  menus,
  onChange,
  onRemove,
}: {
  column: FooterColumn;
  menus: MenuRef[];
  onChange: (next: FooterColumn) => void;
  onRemove: () => void;
}) {
  const links = column.links ?? [];

  function addLink() {
    onChange({ ...column, links: [...links, { label: "", url: "" }] });
  }
  function updateLink(index: number, label: string, url: string) {
    onChange({ ...column, links: links.map((l, i) => (i === index ? { label, url } : l)) });
  }
  function removeLink(index: number) {
    onChange({ ...column, links: links.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label>Column heading</Label>
          <Input value={column.heading} onChange={(e) => onChange({ ...column, heading: e.target.value })} />
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove column">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1.5">
        <Label>Use a menu (optional)</Label>
        <Select value={column.menuId ?? "__none__"} onValueChange={(v) => onChange({ ...column, menuId: v === "__none__" ? null : v })}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None — use custom links below</SelectItem>
            {menus.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!column.menuId ? (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input value={link.label} onChange={(e) => updateLink(index, e.target.value, link.url)} placeholder="Label" className="flex-1" />
              <Input value={link.url} onChange={(e) => updateLink(index, link.label, e.target.value)} placeholder="URL" className="flex-1" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(index)} aria-label="Remove link">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addLink}>
            <Plus className="h-4 w-4" /> Add link
          </Button>
        </div>
      ) : null}
    </div>
  );
}
