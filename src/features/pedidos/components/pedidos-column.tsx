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
import type { KitchenColumn as KitchenColumnType } from "../hooks/use-pedidos-columns";
import type { KitchenOrder } from "../hooks/use-pedidos";
import { ColumnIcon } from "./column-icon";
import { OrderCard } from "./order-card";

interface KitchenColumnProps {
  column: KitchenColumnType;
  orders: KitchenOrder[];
  // próxima coluna por position (passada aos cards p/ o botão de avançar)
  nextColumn: KitchenColumnType | null;
  // coluna terminal (isFinal) p/ a ação direta "Entregue" nos cards
  finalColumn?: KitchenColumnType | null;
  // há um arraste em curso em qualquer lugar do board
  isDragActive?: boolean;
  // coluna de origem do card em arraste (p/ não realçar a própria origem)
  activeColumnId?: string | null;
  onEdit?: (column: KitchenColumnType) => void;
}

export function KitchenColumn({
  column,
  orders,
  nextColumn,
  finalColumn,
  isDragActive = false,
  activeColumnId = null,
  onEdit,
}: KitchenColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { columnId: column.id },
  });

  const count = orders.length;
  const isFull = column.wipLimit != null && count >= column.wipLimit;

  // Feedback de alvo durante o arraste. A origem não se destaca (o card já está
  // lá). Alvo cheio ⇒ realce "bloqueado" (vermelho), avisando que o servidor
  // vai recusar antes mesmo de soltar.
  const isSource = activeColumnId === column.id;
  const isCandidate = isDragActive && !isSource;
  const isValidTarget = isOver && isCandidate && !isFull;
  const isBlockedTarget = isOver && isCandidate && isFull;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors",
        isValidTarget && "ring-2 ring-primary/60 bg-muted/60",
        isBlockedTarget &&
          "ring-2 ring-destructive/60 bg-destructive/5 cursor-not-allowed",
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

      <ScrollArea className="h-[calc(100vh-18rem)] px-2 py-2 [&>[data-slot=scroll-area-viewport]>div]:!block">
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
              <div
                className={cn(
                  "flex items-center justify-center rounded-md px-1 py-6 text-center text-xs text-muted-foreground transition-colors",
                  isCandidate && "border-2 border-dashed",
                  isValidTarget && "border-primary/60 text-primary",
                  isBlockedTarget && "border-destructive/60 text-destructive",
                )}
              >
                {isBlockedTarget
                  ? "Coluna cheia"
                  : isCandidate
                    ? "Solte aqui"
                    : "Sem pedidos"}
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
