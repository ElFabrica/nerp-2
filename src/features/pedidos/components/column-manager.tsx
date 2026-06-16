"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { KitchenColumn } from "../hooks/use-pedidos-columns";
import {
  useMutationDeleteColumn,
  useMutationReorderColumns,
  useMutationUpdateColumn,
  useQueryKitchenColumns,
} from "../hooks/use-pedidos-columns";
import { ColumnForm } from "./column-form";
import { ColumnIcon } from "./column-icon";

export function ColumnManager() {
  const [open, setOpen] = useState(false);
  // a gestão mostra também as colunas escondidas (includeInactive: true)
  const { data: columns = [] } = useQueryKitchenColumns(true);

  const reorder = useMutationReorderColumns();
  const [items, setItems] = useState<KitchenColumn[]>([]);

  // espelha a lista do servidor localmente p/ o drag de reordenação
  useEffect(() => {
    setItems(columns);
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((c) => c.id === active.id);
    const newIndex = items.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next); // otimista
    reorder.mutate({
      order: next.map((c, index) => ({ id: c.id, position: index })),
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Settings2 className="size-4" />
          Gerenciar colunas
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Gerenciar colunas</SheetTitle>
          <SheetDescription>
            Renomeie, recolorir, reordene (arraste), esconda ou apague as
            colunas do kanban.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={items.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2 py-2">
                {items.map((column) => (
                  <ColumnRow key={column.id} column={column} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="border-t p-4">
          <ColumnForm>
            <Button className="w-full">
              <Plus className="size-4" />
              Adicionar coluna
            </Button>
          </ColumnForm>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ColumnRow({ column }: { column: KitchenColumn }) {
  const updateColumn = useMutationUpdateColumn();
  const deleteColumn = useMutationDeleteColumn();

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-card p-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Reordenar coluna"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <span
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: column.color }}
        aria-hidden
      />
      <ColumnIcon icon={column.icon} className="size-4 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{column.name}</p>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {column.isInitial && (
            <Badge variant="secondary" className="text-[10px]">
              Entrada
            </Badge>
          )}
          {column.showOnTv && (
            <Badge variant="secondary" className="text-[10px]">
              TV
            </Badge>
          )}
          {column.isFinal && (
            <Badge variant="secondary" className="text-[10px]">
              Terminal
            </Badge>
          )}
          {column.wipLimit != null && (
            <Badge variant="outline" className="text-[10px]">
              WIP {column.wipLimit}
            </Badge>
          )}
        </div>
      </div>

      {/* esconder/mostrar: toggle de isActive */}
      <Switch
        checked={column.isActive}
        onCheckedChange={(checked) =>
          updateColumn.mutate({ id: column.id, isActive: checked })
        }
        aria-label="Coluna visível"
      />

      <ColumnForm column={column}>
        <Button size="icon-sm" variant="ghost" aria-label="Editar coluna">
          <Pencil className="size-3.5" />
        </Button>
      </ColumnForm>

      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Apagar coluna"
        disabled={deleteColumn.isPending}
        onClick={() => deleteColumn.mutate({ id: column.id })}
      >
        {deleteColumn.isPending ? (
          <Spinner />
        ) : (
          <Trash2 className="size-3.5 text-destructive" />
        )}
      </Button>
    </div>
  );
}
