"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { ModeToggle } from "./mode-toggle";

export function AppHeader() {
  const { isMobile } = useSidebar();
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4 flex-1">
        {isMobile && <SidebarTrigger />}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos, vendas, clientes..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ModeToggle />
      </div>
    </header>
  );
}
