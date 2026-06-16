"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Pencil } from "lucide-react";
import type { KitchenColumn as KitchenColumnType } from "../hooks/use-kitchen-columns";
import type { KitchenOrder } from "../hooks/use-kitchen";
import { ColumnIcon } from "./column-icon";
import { OrderCard } from "./order-card";

interface KitchenColumnProps {
  column: KitchenColumnType;
  orders: KitchenOrder[];
  // próxima coluna por position (passada aos cards p/ o botão de avançar)
  nextColumn: KitchenColumnType | null;
  // coluna terminal (isFinal) p/ a ação direta "Entregue" nos cards
  finalColumn?: KitchenColumnType | null;
  onEdit?: (column: KitchenColumnType) => void;
}

export function KitchenColumn({
  column,
  orders,
  nextColumn,
  finalColumn,
  onEdit,
}: KitchenColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { columnId: column.id },
  });

  const count = orders.length;
  const isFull = column.wipLimit != null && count >= column.wipLimit;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors",
        isOver && "ring-2 ring-primary/60 bg-muted/60",
      )}
    >
      {/* Cabeçalho dinâmico com a cor de identificação da coluna. */}
      <div
        className="flex items-center gap-2 rounded-t-lg border-t-4 px-3 py-2.5"
        style={{ borderTopColor: column.color }}
      >
        <ColumnIcon icon={column.icon} className="size-4 shrink-0" />
        <span className="flex-1 truncate text-sm font-semibold">
          {column.name}
        </span>
        <Badge variant={isFull ? "destructive" : "secondary"}>
          {column.wipLimit != null ? `${count}/${column.wipLimit}` : count}
        </Badge>
        {onEdit && (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={`Editar coluna ${column.name}`}
            onClick={() => onEdit(column)}
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-18rem)] px-2 py-2">
        <SortableContext
          items={orders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                nextColumn={nextColumn}
                finalColumn={finalColumn}
              />
            ))}
            {count === 0 && (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                Sem pedidos
              </p>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
