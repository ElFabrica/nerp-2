"use client";

import { Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStores } from "@/features/stores/hooks/use-stores";

interface AddPageButtonProps {
  onSelectStore: (storeId: string) => void;
  isPending: boolean;
}

export function AddPageButton({ onSelectStore, isPending }: AddPageButtonProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { stores, isLoading } = useStores(search || undefined);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-dashed py-6"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Adicionar página
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-72 p-2">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar loja…"
            className="pl-7"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {isLoading && (
            <p className="p-2 text-xs text-muted-foreground">Carregando…</p>
          )}
          {!isLoading && stores.length === 0 && (
            <p className="p-2 text-xs text-muted-foreground">
              Nenhuma loja encontrada.
            </p>
          )}
          {stores.map((store) => (
            <button
              key={store.id}
              type="button"
              className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => {
                onSelectStore(store.id);
                setOpen(false);
                setSearch("");
              }}
            >
              {store.name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
