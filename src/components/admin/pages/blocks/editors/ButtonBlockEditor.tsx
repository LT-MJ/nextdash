"use client";

import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ButtonBlockData } from "@/lib/pages/blocks/types";

export function ButtonBlockEditor({ data, onChange }: { data: ButtonBlockData; onChange: (next: ButtonBlockData) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Button text</Label>
        <Input value={data.text} onChange={(e) => onChange({ ...data, text: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Link URL</Label>
        <Input value={data.href} onChange={(e) => onChange({ ...data, href: e.target.value })} placeholder="https://…" />
      </div>
      <div className="space-y-1.5">
        <Label>Style</Label>
        <Select value={data.style ?? "primary"} onValueChange={(v) => onChange({ ...data, style: v as ButtonBlockData["style"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Align</Label>
        <Select value={data.align ?? "left"} onValueChange={(v) => onChange({ ...data, align: v as ButtonBlockData["align"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
