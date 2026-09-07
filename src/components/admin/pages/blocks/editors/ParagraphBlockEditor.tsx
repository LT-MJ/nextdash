"use client";

import { Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ParagraphBlockData } from "@/lib/pages/blocks/types";

export function ParagraphBlockEditor({ data, onChange }: { data: ParagraphBlockData; onChange: (next: ParagraphBlockData) => void }) {
  return (
    <div className="space-y-2">
      <Textarea
        value={data.text}
        onChange={(e) => onChange({ ...data, text: e.target.value })}
        placeholder="Paragraph text — for inline links/bold/etc. use a Custom HTML block instead."
        rows={3}
      />
      <Select value={data.align ?? "left"} onValueChange={(v) => onChange({ ...data, align: v as ParagraphBlockData["align"] })}>
        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="left">Left</SelectItem>
          <SelectItem value="center">Center</SelectItem>
          <SelectItem value="right">Right</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
