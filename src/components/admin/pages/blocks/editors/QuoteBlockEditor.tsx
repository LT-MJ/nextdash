"use client";

import { Input, Label, Textarea } from "@/components/ui/input";
import type { QuoteBlockData } from "@/lib/pages/blocks/types";

export function QuoteBlockEditor({ data, onChange }: { data: QuoteBlockData; onChange: (next: QuoteBlockData) => void }) {
  return (
    <div className="space-y-2">
      <Textarea value={data.text} onChange={(e) => onChange({ ...data, text: e.target.value })} placeholder="Quoted text" rows={3} />
      <div className="space-y-1.5">
        <Label>Citation (optional)</Label>
        <Input value={data.citation ?? ""} onChange={(e) => onChange({ ...data, citation: e.target.value || undefined })} placeholder="— Source" />
      </div>
    </div>
  );
}
