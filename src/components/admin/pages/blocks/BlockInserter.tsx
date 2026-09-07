"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BLOCK_REGISTRY, type BlockRegistryEntry } from "@/lib/pages/blocks/registry";
import type { BlockType } from "@/lib/pages/blocks/types";

const GROUPS: BlockRegistryEntry["group"][] = ["Text", "Media", "Layout", "Advanced"];

export function BlockInserter({ onInsert, allowColumns }: { onInsert: (type: BlockType) => void; allowColumns: boolean }) {
  const entries = BLOCK_REGISTRY.filter((entry) => allowColumns || entry.type !== "columns");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="h-4 w-4" /> Add block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {GROUPS.map((group) => {
          const groupEntries = entries.filter((e) => e.group === group);
          if (groupEntries.length === 0) return null;
          return (
            <div key={group}>
              <DropdownMenuLabel>{group}</DropdownMenuLabel>
              {groupEntries.map((entry) => (
                <DropdownMenuItem key={entry.type} onSelect={() => onInsert(entry.type)}>
                  {entry.label}
                </DropdownMenuItem>
              ))}
              {group !== "Advanced" ? <DropdownMenuSeparator /> : null}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
