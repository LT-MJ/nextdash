"use client";

import { useState } from "react";
import { LogOut, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "./CommandPalette";

export function AdminTopbar({ userName, roleName }: { userName: string; roleName: string }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-5">
      <button
        onClick={() => setPaletteOpen(true)}
        className="flex w-full max-w-sm items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-ring"
      >
        <Search className="h-4 w-4" aria-hidden />
        Search content, products, orders…
        <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </button>
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{roleName}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
