"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MenuRow {
  id: string;
  name: string;
  itemCount: number;
  usages: string[];
}

export function MenusListClient({ menus }: { menus: MenuRow[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/menus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(body.error ?? "Failed to create menu.");
      return;
    }
    router.push(`/admin/menus/${body.menu.id}`);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/menus/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      window.alert(body.error ?? "Failed to delete menu.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setCreating(true)}>
        <Plus className="h-4 w-4" /> New menu
      </Button>

      {menus.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Used in</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {menus.map((menu) => (
              <TableRow key={menu.id}>
                <TableCell>
                  <Link href={`/admin/menus/${menu.id}`} className="font-medium text-primary hover:underline">
                    {menu.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{menu.itemCount}</TableCell>
                <TableCell className="text-muted-foreground">{menu.usages.length > 0 ? menu.usages.join(", ") : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === menu.id}
                    onClick={() => {
                      if (window.confirm(`Delete "${menu.name}"? This cannot be undone.`)) handleDelete(menu.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="menu-name">Name</Label>
            <Input id="menu-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Primary Navigation" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !name.trim()}>
              {saving ? "Creating…" : "Create menu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
