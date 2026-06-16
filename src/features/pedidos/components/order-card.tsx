"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNow, formatElapsed } from "@/hooks/use-elapsed";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PREP_MINUTES,
  getOrderUrgency,
  urgencyStyles,
} from "@/utils/pedidos-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Archive,
  ArrowRight,
  CheckCheck,
  Clock,
  GripVertical,
  MoreVertical,
} from "lucide-react";
import type { KitchenColumn } from "../hooks/use-pedidos-columns";
import {
  useMutationMoveKitchenOrder,
  useMutationSetArchivedKitchenOrder,
} from "../hooks/use-pedidos";
import type { KitchenOrder } from "../hooks/use-pedidos";

interface OrderCardProps {
  order: KitchenOrder;
  // próxima coluna por position (p/ o botão de avançar); null em colunas isFinal
  nextColumn: KitchenColumn | null;
  // coluna terminal (isFinal); alvo da ação direta "Entregue". null se a org não tiver
  finalColumn?: KitchenColumn | null;
  // quando true, é só o "fantasma" do DragOverlay (sem listeners/sortable)
  overlay?: boolean;
}

export function OrderCard({
  order,
  nextColumn,
  finalColumn = null,
  overlay = false,
}: OrderCardProps) {
  const move = useMutationMoveKitchenOrder();
  const setArchived = useMutationSetArchivedKitchenOrder();

  // Pedido entregue (na coluna final): congela o contador no momento em que
  // entrou na coluna e para de pulsar — não conta mais tempo nem alerta atraso.
  const isDelivered = finalColumn != null && order.columnId === finalColumn.id;

  // Relógio de 1s: o decorrido (mm:ss) e a urgência são recalculados no cliente
  // a partir de createdAt/estimatedMinutes, sem depender do polling.
  const now = useNow();
  const refTime = isDelivered ? new Date(order.columnEnteredAt).getTime() : now;
  const urgency = getOrderUrgency(
    order.createdAt,
    order.estimatedMinutes,
    refTime,
  );
  const style = urgencyStyles[urgency];

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

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : dndStyle}
      className={cn(
        "gap-2 border-2 p-3 shadow-sm",
        style.border,
        isDragging && "opacity-40",
        overlay && "rotate-3 shadow-lg",
        // entregue: para de pulsar (sobrescreve o animate-pulse do "overdue")
        isDelivered && "animate-none",
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

        <div className="min-w-0 flex-1 overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="block w-full truncate text-sm font-semibold">
                Mesa {order.tableNumber} · {order.dishName}
              </p>
            </TooltipTrigger>
            <TooltipContent>
              Mesa {order.tableNumber} · {order.dishName}
            </TooltipContent>
          </Tooltip>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge className={cn("gap-1", style.badge)}>
              <Clock className="size-3" />
              {formatElapsed(order.createdAt, refTime)}
            </Badge>
            <Badge variant="outline">
              ~{order.estimatedMinutes ?? DEFAULT_PREP_MINUTES} min
            </Badge>
            {urgency !== "normal" && (
              <Badge className={style.badge}>{style.label}</Badge>
            )}
          </div>
        </div>

        {/* Menu de ações no canto superior direito (não inicia o arraste). */}
        {!overlay && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="-mr-1 -mt-1 shrink-0 text-muted-foreground"
                aria-label="Ações do pedido"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={setArchived.isPending}
                onClick={() =>
                  setArchived.mutate({ id: order.id, archived: true })
                }
              >
                <Archive className="size-4" />
                Arquivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Fallback por botão: avança p/ a próxima coluna sem arrastar.
          Oculto quando a próxima já é a final — aí usamos o botão "Entregue". */}
      {nextColumn && nextColumn.id !== finalColumn?.id && (
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

      {/* Ação direta: marca como entregue movendo o card p/ a coluna final. */}
      {finalColumn && order.columnId !== finalColumn.id && (
        <Button
          type="button"
          size="sm"
          className="w-full justify-center"
          disabled={move.isPending}
          onClick={() =>
            move.mutate({ id: order.id, toColumnId: finalColumn.id })
          }
        >
          <CheckCheck className="size-3.5" />
          Entregue
        </Button>
      )}
    </Card>
  );
}
