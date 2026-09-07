"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronUp, ChevronDown, Pencil, Trash2, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddMenuItemDialog, type MenuItemFormValues } from "./AddMenuItemDialog";
import { resolveMenuItemHref } from "@/lib/menus/resolve";
import { cn } from "@/lib/utils";
import type { MenuItemLinkType } from "@/lib/menus/validation";

interface Ref {
  id: string;
  title?: string;
  name?: string;
  slug: string;
}

interface ApiMenuItem {
  id: string;
  parentId: string | null;
  label: string;
  linkType: string;
  url: string | null;
  targetId: string | null;
  openInNewTab: boolean;
  order: number;
}

interface MenuItemTreeProps {
  menuId: string;
  initialName: string;
  initialItems: ApiMenuItem[];
  pages: Ref[];
  posts: Ref[];
  categories: Ref[];
}

export function MenuItemTree({ menuId, initialName, initialItems, pages, posts, categories }: MenuItemTreeProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [items, setItems] = useState<ApiMenuItem[]>(initialItems);
  const [dialogState, setDialogState] = useState<{ mode: "add"; parentId: string | null } | { mode: "edit"; item: ApiMenuItem } | null>(null);

  const lookups = {
    pagesById: new Map(pages.map((p) => [p.id, { slug: p.slug }])),
    postsById: new Map(posts.map((p) => [p.id, { slug: p.slug }])),
    categoriesById: new Map(categories.map((c) => [c.id, { slug: c.slug }])),
  };

  const topLevel = items.filter((i) => !i.parentId).sort((a, b) => a.order - b.order);
  const childrenOf = (parentId: string) => items.filter((i) => i.parentId === parentId).sort((a, b) => a.order - b.order);

  async function persistOrder(next: ApiMenuItem[]) {
    setItems(next);
    await fetch(`/api/admin/menus/${menuId}/items/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next.map((i) => ({ id: i.id, parentId: i.parentId, order: i.order })) }),
    });
  }

  function reorderGroup(group: ApiMenuItem[], fromIndex: number, toIndex: number): ApiMenuItem[] {
    const reordered = arrayMove(group, fromIndex, toIndex).map((item, index) => ({ ...item, order: index }));
    const otherIds = new Set(group.map((i) => i.id));
    const rest = items.filter((i) => !otherIds.has(i.id));
    return [...rest, ...reordered];
  }

  function handleTopLevelDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = topLevel.findIndex((i) => i.id === active.id);
    const toIndex = topLevel.findIndex((i) => i.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;
    persistOrder(reorderGroup(topLevel, fromIndex, toIndex));
  }

  function moveWithinGroup(group: ApiMenuItem[], index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= group.length) return;
    persistOrder(reorderGroup(group, index, target));
  }

  function setParent(item: ApiMenuItem, parentId: string | null) {
    const group = parentId ? childrenOf(parentId) : topLevel;
    const next = items.map((i) => (i.id === item.id ? { ...i, parentId, order: group.length } : i));
    persistOrder(next);
  }

  async function handleDelete(item: ApiMenuItem) {
    if (!window.confirm(`Delete "${item.label}"?`)) return;
    const res = await fetch(`/api/admin/menus/${menuId}/items/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      window.alert("Failed to delete item.");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id).map((i) => (i.parentId === item.id ? { ...i, parentId: null } : i)));
  }

  async function handleSaveName() {
    setSavingName(true);
    await fetch(`/api/admin/menus/${menuId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setSavingName(false);
    router.refresh();
  }

  async function handleDialogSubmit(values: MenuItemFormValues, parentId: string | null) {
    if (dialogState?.mode === "edit") {
      const res = await fetch(`/api/admin/menus/${menuId}/items/${dialogState.item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, parentId: dialogState.item.parentId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(body.error ?? "Failed to update item.");
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === body.item.id ? body.item : i)));
    } else {
      const res = await fetch(`/api/admin/menus/${menuId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, parentId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(body.error ?? "Failed to add item.");
        return;
      }
      setItems((prev) => [...prev, body.item]);
    }
    setDialogState(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-2">
        <div className="max-w-sm flex-1 space-y-1.5">
          <Label htmlFor="menu-rename">Menu name</Label>
          <Input id="menu-rename" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button variant="outline" onClick={handleSaveName} disabled={savingName || name === initialName}>
          {savingName ? "Saving…" : "Save name"}
        </Button>
      </div>

      <TopLevelList
        topLevel={topLevel}
        childrenOf={childrenOf}
        lookups={lookups}
        onDragEnd={handleTopLevelDragEnd}
        onMove={(item, index, direction) => moveWithinGroup(topLevel, index, direction)}
        onMoveChild={(parentId, index, direction) => moveWithinGroup(childrenOf(parentId), index, direction)}
        onSetParent={setParent}
        onEdit={(item) => setDialogState({ mode: "edit", item })}
        onDelete={handleDelete}
        onAddChild={(parentId) => setDialogState({ mode: "add", parentId })}
      />

      <Button variant="outline" onClick={() => setDialogState({ mode: "add", parentId: null })}>
        <Plus className="h-4 w-4" /> Add item
      </Button>

      {dialogState ? (
        <AddMenuItemDialog
          open
          onOpenChange={(open) => !open && setDialogState(null)}
          initialValues={dialogState.mode === "edit" ? { ...dialogState.item, linkType: dialogState.item.linkType as MenuItemLinkType } : undefined}
          pages={pages}
          posts={posts}
          categories={categories}
          onSubmit={(values) => handleDialogSubmit(values, dialogState.mode === "add" ? dialogState.parentId : dialogState.item.parentId)}
        />
      ) : null}
    </div>
  );
}

function TopLevelList({
  topLevel,
  childrenOf,
  lookups,
  onDragEnd,
  onMove,
  onMoveChild,
  onSetParent,
  onEdit,
  onDelete,
  onAddChild,
}: {
  topLevel: ApiMenuItem[];
  childrenOf: (parentId: string) => ApiMenuItem[];
  lookups: Parameters<typeof resolveMenuItemHref>[1];
  onDragEnd: (event: DragEndEvent) => void;
  onMove: (item: ApiMenuItem, index: number, direction: -1 | 1) => void;
  onMoveChild: (parentId: string, index: number, direction: -1 | 1) => void;
  onSetParent: (item: ApiMenuItem, parentId: string | null) => void;
  onEdit: (item: ApiMenuItem) => void;
  onDelete: (item: ApiMenuItem) => void;
  onAddChild: (parentId: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (topLevel.length === 0) return <p className="text-sm text-muted-foreground">No items yet — add one below.</p>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={topLevel.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {topLevel.map((item, index) => (
            <div key={item.id} className="space-y-2">
              <MenuItemRow
                item={item}
                href={resolveMenuItemHref(item, lookups)}
                sortable
                isFirst={index === 0}
                isLast={index === topLevel.length - 1}
                topLevelOptions={topLevel.filter((t) => t.id !== item.id)}
                onMove={(direction) => onMove(item, index, direction)}
                onSetParent={(parentId) => onSetParent(item, parentId)}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item)}
                onAddChild={() => onAddChild(item.id)}
              />
              {childrenOf(item.id).length > 0 ? (
                <div className="ml-8 space-y-2 border-l border-border pl-4">
                  {childrenOf(item.id).map((child, childIndex, arr) => (
                    <MenuItemRow
                      key={child.id}
                      item={child}
                      href={resolveMenuItemHref(child, lookups)}
                      sortable={false}
                      isFirst={childIndex === 0}
                      isLast={childIndex === arr.length - 1}
                      topLevelOptions={topLevel.filter((t) => t.id !== child.id)}
                      onMove={(direction) => onMoveChild(item.id, childIndex, direction)}
                      onSetParent={(parentId) => onSetParent(child, parentId)}
                      onEdit={() => onEdit(child)}
                      onDelete={() => onDelete(child)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function MenuItemRow({
  item,
  href,
  sortable,
  isFirst,
  isLast,
  topLevelOptions,
  onMove,
  onSetParent,
  onEdit,
  onDelete,
  onAddChild,
}: {
  item: ApiMenuItem;
  href: string;
  sortable: boolean;
  isFirst: boolean;
  isLast: boolean;
  topLevelOptions: ApiMenuItem[];
  onMove: (direction: -1 | 1) => void;
  onSetParent: (parentId: string | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
}) {
  const sortableState = useSortable({ id: item.id, disabled: !sortable });
  const style = sortable ? { transform: CSS.Transform.toString(sortableState.transform), transition: sortableState.transition } : undefined;

  return (
    <div
      ref={sortable ? sortableState.setNodeRef : undefined}
      style={style}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2",
        sortable && sortableState.isDragging && "opacity-60 shadow-lg"
      )}
    >
      {sortable ? (
        <button type="button" {...sortableState.attributes} {...sortableState.listeners} aria-label="Drag to reorder" className="cursor-grab rounded p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-6" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.label}</p>
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          {href} {item.openInNewTab ? <ExternalLink className="h-3 w-3" /> : null}
        </p>
      </div>
      <div className="w-40">
        <Select value={item.parentId ?? "__top__"} onValueChange={(v) => onSetParent(v === "__top__" ? null : v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__top__">Top level</SelectItem>
            {topLevelOptions.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>Nest under &ldquo;{opt.label}&rdquo;</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={() => onMove(-1)} disabled={isFirst} aria-label="Move up" className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30">
          <ChevronUp className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={isLast} aria-label="Move down" className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30">
          <ChevronDown className="h-4 w-4" />
        </button>
        {onAddChild ? (
          <button type="button" onClick={onAddChild} aria-label="Add child item" className="rounded p-1 text-muted-foreground hover:bg-accent">
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
        <button type="button" onClick={onEdit} aria-label="Edit item" className="rounded p-1 text-muted-foreground hover:bg-accent">
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" onClick={onDelete} aria-label="Delete item" className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
