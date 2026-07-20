"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "./ui/sidebar";
import { ModeToggle } from "./mode-toggle";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        {/* No celular o campo espremia o trigger da sidebar sem entregar valor. */}
        <div className="relative hidden w-full max-w-md md:block">
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
