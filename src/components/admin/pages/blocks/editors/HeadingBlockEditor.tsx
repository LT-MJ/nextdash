"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HeadingBlockData } from "@/lib/pages/blocks/types";

export function HeadingBlockEditor({ data, onChange }: { data: HeadingBlockData; onChange: (next: HeadingBlockData) => void }) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <Input
        value={data.text}
        onChange={(e) => onChange({ ...data, text: e.target.value })}
        placeholder="Heading text"
        className="min-w-[200px] flex-1 text-lg font-semibold"
      />
      <Select value={String(data.level)} onValueChange={(v) => onChange({ ...data, level: Number(v) as HeadingBlockData["level"] })}>
        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <SelectItem key={level} value={String(level)}>H{level}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={data.align ?? "left"} onValueChange={(v) => onChange({ ...data, align: v as HeadingBlockData["align"] })}>
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
