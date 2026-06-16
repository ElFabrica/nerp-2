import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "sonner";
import type { KitchenColumn } from "./use-kitchen-columns";
import { useMutationMoveKitchenOrder } from "./use-kitchen";

interface UseKanbanDndProps {
  columns: KitchenColumn[];
  // contagem atual de cards por columnId (p/ bloqueio de WIP no cliente)
  countIn: (columnId: string) => number;
}

// Encapsula o estado e a transição do DndContext (genérica, baseada em columnId).
export function useKanbanDnd({ columns, countIn }: UseKanbanDndProps) {
  const [activeId, setActiveId] = useState<string | null>(null); // p/ o DragOverlay
  const move = useMutationMoveKitchenOrder();

  function onDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const from = event.active.data.current?.columnId as string | undefined;
    const to = (event.over?.data.current?.columnId ?? event.over?.id) as
      | string
      | undefined;

    if (!from || !to || from === to) return; // mesma coluna ⇒ snap back

    // Bloqueio de WIP no cliente p/ feedback imediato (o servidor é a fonte de verdade).
    const dest = columns.find((c) => c.id === to);
    if (dest?.wipLimit != null && countIn(to) >= dest.wipLimit) {
      toast.error(
        `Coluna "${dest.name}" está cheia (limite ${dest.wipLimit}).`,
      );
      return;
    }

    move.mutate({ id: event.active.id as string, toColumnId: to });
  }

  return { activeId, setActiveId, onDragStart, onDragEnd };
}
