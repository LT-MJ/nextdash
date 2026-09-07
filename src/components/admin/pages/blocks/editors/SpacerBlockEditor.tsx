"use client";

import { Input, Label } from "@/components/ui/input";
import type { SpacerBlockData } from "@/lib/pages/blocks/types";

export function SpacerBlockEditor({ data, onChange }: { data: SpacerBlockData; onChange: (next: SpacerBlockData) => void }) {
  return (
    <div className="max-w-[160px] space-y-1.5">
      <Label>Height (px)</Label>
      <Input
        type="number"
        min={8}
        max={200}
        value={data.height}
        onChange={(e) => onChange({ height: Math.min(200, Math.max(8, Number(e.target.value) || 8)) })}
      />
    </div>
  );
}
