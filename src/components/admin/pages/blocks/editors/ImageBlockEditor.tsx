"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import type { ImageBlockData } from "@/lib/pages/blocks/types";

export function ImageBlockEditor({ data, onChange }: { data: ImageBlockData; onChange: (next: ImageBlockData) => void }) {
  const [browsing, setBrowsing] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label>Image URL</Label>
          <Input value={data.src} onChange={(e) => onChange({ ...data, src: e.target.value })} placeholder="https://…" />
        </div>
        <Button type="button" variant="outline" onClick={() => setBrowsing(true)}>
          <ImageIcon className="h-4 w-4" /> Browse library
        </Button>
      </div>
      {data.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.src} alt={data.alt} className="max-h-40 rounded-md border border-border object-contain" />
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Alt text</Label>
          <Input value={data.alt} onChange={(e) => onChange({ ...data, alt: e.target.value })} placeholder="Describes the image" />
        </div>
        <div className="space-y-1.5">
          <Label>Caption (optional)</Label>
          <Input value={data.caption ?? ""} onChange={(e) => onChange({ ...data, caption: e.target.value || undefined })} />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Link to (optional)</Label>
          <Input value={data.href ?? ""} onChange={(e) => onChange({ ...data, href: e.target.value || undefined })} placeholder="https://…" />
        </div>
        <div className="space-y-1.5">
          <Label>Align</Label>
          <Select value={data.align ?? "left"} onValueChange={(v) => onChange({ ...data, align: v as ImageBlockData["align"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="full">Full width</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={browsing} onOpenChange={setBrowsing}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose an image</DialogTitle>
          </DialogHeader>
          <MediaLibrary
            onSelect={(asset) => {
              onChange({ ...data, src: asset.url, alt: data.alt || asset.alt || "" });
              setBrowsing(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
