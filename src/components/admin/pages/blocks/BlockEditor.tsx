"use client";

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { BlockListItem } from "./BlockListItem";
import { BlockInserter } from "./BlockInserter";
import { createBlock } from "@/lib/pages/blocks/registry";
import type { Block, BlockType } from "@/lib/pages/blocks/types";

interface BlockEditorProps {
  value: Block[];
  onChange: (next: Block[]) => void;
  /** Nesting depth — columns render an inner BlockEditor per column at depth 1, capped there (no columns-in-columns). */
  depth?: number;
}

export function BlockEditor({ value, onChange, depth = 0 }: BlockEditorProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.findIndex((b) => b.id === active.id);
    const newIndex = value.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(value, oldIndex, newIndex));
  }

  function updateBlockAt(index: number, next: Block) {
    onChange(value.map((b, i) => (i === index ? next : b)));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    onChange(arrayMove(value, index, target));
  }

  function duplicateBlock(index: number) {
    const original = value[index];
    const copy: Block = { ...original, id: crypto.randomUUID() };
    onChange([...value.slice(0, index + 1), copy, ...value.slice(index + 1)]);
  }

  function deleteBlock(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function insertBlock(type: BlockType) {
    onChange([...value, createBlock(type)]);
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={value.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {value.map((block, index) => (
              <BlockListItem
                key={block.id}
                block={block}
                depth={depth}
                onChange={(next) => updateBlockAt(index, next)}
                onMoveUp={() => moveBlock(index, -1)}
                onMoveDown={() => moveBlock(index, 1)}
                onDuplicate={() => duplicateBlock(index)}
                onDelete={() => deleteBlock(index)}
                isFirst={index === 0}
                isLast={index === value.length - 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {value.length === 0 ? <p className="text-sm text-muted-foreground">No blocks yet — add one below.</p> : null}
      <BlockInserter onInsert={insertBlock} allowColumns={depth === 0} />
    </div>
  );
}
