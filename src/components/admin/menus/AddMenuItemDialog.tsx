"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MenuItemLinkType } from "@/lib/menus/validation";

interface Ref {
  id: string;
  title?: string;
  name?: string;
  slug: string;
}

export interface MenuItemFormValues {
  label: string;
  linkType: MenuItemLinkType;
  url: string | null;
  targetId: string | null;
  openInNewTab: boolean;
}

interface AddMenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<MenuItemFormValues>;
  pages: Ref[];
  posts: Ref[];
  categories: Ref[];
  onSubmit: (values: MenuItemFormValues) => void;
}

const TABS: { value: MenuItemLinkType; label: string }[] = [
  { value: "CUSTOM", label: "Custom Link" },
  { value: "PAGE", label: "Page" },
  { value: "POST", label: "Post" },
  { value: "CATEGORY", label: "Category" },
];

export function AddMenuItemDialog({ open, onOpenChange, initialValues, pages, posts, categories, onSubmit }: AddMenuItemDialogProps) {
  const [tab, setTab] = useState<MenuItemLinkType>(initialValues?.linkType ?? "CUSTOM");
  const [label, setLabel] = useState(initialValues?.label ?? "");
  const [url, setUrl] = useState(initialValues?.url ?? "");
  const [targetId, setTargetId] = useState(initialValues?.targetId ?? "");
  const [openInNewTab, setOpenInNewTab] = useState(initialValues?.openInNewTab ?? false);

  const refsByTab: Record<string, Ref[]> = { PAGE: pages, POST: posts, CATEGORY: categories };

  function handleTargetPick(ref: Ref) {
    setTargetId(ref.id);
    if (!label) setLabel(ref.title ?? ref.name ?? "");
  }

  function handleSubmit() {
    onSubmit({
      label: label.trim(),
      linkType: tab,
      url: tab === "CUSTOM" ? url.trim() : null,
      targetId: tab === "CUSTOM" ? null : targetId || null,
      openInNewTab,
    });
  }

  const canSubmit = label.trim().length > 0 && (tab === "CUSTOM" ? url.trim().length > 0 : targetId.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialValues ? "Edit menu item" : "Add menu item"}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as MenuItemLinkType)}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="CUSTOM" className="space-y-3">
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… or /a-page" />
            </div>
          </TabsContent>

          {(["PAGE", "POST", "CATEGORY"] as const).map((linkType) => (
            <TabsContent key={linkType} value={linkType} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Choose {linkType.toLowerCase()}</Label>
                <Select value={targetId} onValueChange={(id) => handleTargetPick(refsByTab[linkType].find((r) => r.id === id)!)}>
                  <SelectTrigger><SelectValue placeholder={`Select a ${linkType.toLowerCase()}…`} /></SelectTrigger>
                  <SelectContent>
                    {refsByTab[linkType].map((ref) => (
                      <SelectItem key={ref.id} value={ref.id}>{ref.title ?? ref.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="space-y-1.5">
          <Label>Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Menu label" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={openInNewTab} onChange={(e) => setOpenInNewTab(e.target.checked)} className="h-4 w-4 rounded border-input" />
          Open in a new tab
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {initialValues ? "Save changes" : "Add item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
