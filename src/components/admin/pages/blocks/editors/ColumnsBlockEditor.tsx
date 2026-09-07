"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BlockEditor } from "../BlockEditor";
import type { ColumnsBlockData } from "@/lib/pages/blocks/types";

export function ColumnsBlockEditor({ data, onChange }: { data: ColumnsBlockData; onChange: (next: ColumnsBlockData) => void }) {
  function setColumnCount(count: 2 | 3) {
    const items = Array.from({ length: count }, (_, i) => data.items[i] ?? []);
    onChange({ columns: count, items });
  }

  return (
    <div className="space-y-3">
      <div className="w-28 space-y-1.5">
        <Select value={String(data.columns)} onValueChange={(v) => setColumnCount(Number(v) as 2 | 3)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 columns</SelectItem>
            <SelectItem value="3">3 columns</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${data.columns}, minmax(0, 1fr))` }}>
        {data.items.slice(0, data.columns).map((columnBlocks, index) => (
          <div key={index} className="rounded-md border border-dashed border-border p-3">
            <BlockEditor
              value={columnBlocks}
              depth={1}
              onChange={(next) => {
                const items = data.items.slice();
                items[index] = next;
                onChange({ ...data, items });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
