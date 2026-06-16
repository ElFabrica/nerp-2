"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, Clock, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import type { KitchenColumn } from "../hooks/use-kitchen-columns";
import { useMutationMoveKitchenOrder } from "../hooks/use-kitchen";
import type { KitchenOrder } from "../hooks/use-kitchen";

interface OrderCardProps {
  order: KitchenOrder;
  // próxima coluna por position (p/ o botão de avançar); null em colunas isFinal
  nextColumn: KitchenColumn | null;
  // quando true, é só o "fantasma" do DragOverlay (sem listeners/sortable)
  overlay?: boolean;
}

// minutos decorridos desde uma data ISO, atualizando a cada 30s
function useElapsedMinutes(sinceIso: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return Math.max(0, Math.floor((now - new Date(sinceIso).getTime()) / 60_000));
}

export function OrderCard({
  order,
  nextColumn,
  overlay = false,
}: OrderCardProps) {
  const move = useMutationMoveKitchenOrder();
  const elapsed = useElapsedMinutes(order.columnEnteredAt);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: order.id,
    data: { columnId: order.columnId },
    disabled: overlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // estourou o tempo estimado? destaca o badge
  const isLate =
    order.estimatedMinutes != null && elapsed >= order.estimatedMinutes;

  return (
    <Card
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      className={cn(
        "gap-2 p-3 shadow-sm",
        isDragging && "opacity-40",
        overlay && "rotate-3 shadow-lg",
      )}
    >
      <div className="flex items-start gap-2">
        {/* Handle de arraste: só ele inicia o drag, p/ não conflitar com cliques. */}
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label="Arrastar pedido"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            Mesa {order.tableNumber} · {order.dishName}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge
              variant={isLate ? "destructive" : "secondary"}
              className="gap-1"
            >
              <Clock className="size-3" />
              {elapsed} min
            </Badge>
            {order.estimatedMinutes != null && (
              <Badge variant="outline">~{order.estimatedMinutes} min</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Fallback por botão: avança p/ a próxima coluna sem arrastar. */}
      {nextColumn && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full justify-center"
          disabled={move.isPending}
          onClick={() =>
            move.mutate({ id: order.id, toColumnId: nextColumn.id })
          }
        >
          <ArrowRight className="size-3.5" />
          {nextColumn.name}
        </Button>
      )}
    </Card>
  );
}
