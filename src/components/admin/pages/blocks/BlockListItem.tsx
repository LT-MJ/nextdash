"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronUp, ChevronDown, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBlockRegistryEntry } from "@/lib/pages/blocks/registry";
import type { Block } from "@/lib/pages/blocks/types";
import { HeadingBlockEditor } from "./editors/HeadingBlockEditor";
import { ParagraphBlockEditor } from "./editors/ParagraphBlockEditor";
import { ImageBlockEditor } from "./editors/ImageBlockEditor";
import { ButtonBlockEditor } from "./editors/ButtonBlockEditor";
import { ColumnsBlockEditor } from "./editors/ColumnsBlockEditor";
import { SpacerBlockEditor } from "./editors/SpacerBlockEditor";
import { DividerBlockEditor } from "./editors/DividerBlockEditor";
import { QuoteBlockEditor } from "./editors/QuoteBlockEditor";
import { CustomHtmlBlockEditor } from "./editors/CustomHtmlBlockEditor";

interface BlockListItemProps {
  block: Block;
  depth: number;
  onChange: (next: Block) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function BlockListItem({ block, onChange, onMoveUp, onMoveDown, onDuplicate, onDelete, isFirst, isLast }: BlockListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const label = getBlockRegistryEntry(block.type).label;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-md border border-border bg-card", isDragging && "opacity-60 shadow-lg")}
    >
      <div className="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5">
        <button type="button" {...attributes} {...listeners} aria-label="Drag to reorder" className="cursor-grab rounded p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className="ml-auto flex items-center gap-0.5">
          <button type="button" onClick={onMoveUp} disabled={isFirst} aria-label="Move block up" className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} aria-label="Move block down" className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30">
            <ChevronDown className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDuplicate} aria-label="Duplicate block" className="rounded p-1 text-muted-foreground hover:bg-accent">
            <Copy className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDelete} aria-label="Delete block" className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <BlockBody block={block} onChange={onChange} />
      </div>
    </div>
  );
}

function BlockBody({ block, onChange }: { block: Block; onChange: (next: Block) => void }) {
  switch (block.type) {
    case "heading":
      return <HeadingBlockEditor data={block.data} onChange={(data) => onChange({ ...block, data })} />;
    case "paragraph":
      return <ParagraphBlockEditor data={block.data} onChange={(data) => onChange({ ...block, data })} />;
    case "image":
      return <ImageBlockEditor data={block.data} onChange={(data) => onChange({ ...block, data })} />;
    case "button":
      return <ButtonBlockEditor data={block.data} onChange={(data) => onChange({ ...block, data })} />;
    case "columns":
      return <ColumnsBlockEditor data={block.data} onChange={(data) => onChange({ ...block, data })} />;
    case "spacer":
      return <SpacerBlockEditor data={block.data} onChange={(data) => onChange({ ...block, data })} />;
    case "divider":
      return <DividerBlockEditor />;
    case "quote":
      return <QuoteBlockEditor data={block.data} onChange={(data) => onChange({ ...block, data })} />;
    case "customHtml":
      return <CustomHtmlBlockEditor data={block.data} onChange={(data) => onChange({ ...block, data })} />;
    default:
      return null;
  }
}
