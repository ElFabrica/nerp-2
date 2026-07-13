"use client";

import { Button } from "@/components/ui/button";
import { constructUrl } from "@/hooks/use-construct-url";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import { formatBRL } from "../lib/book-format";

interface SortableBookItemProps {
  id: string;
  index: number;
  photo: string | undefined;
  storeName: string;
  subtitle: string;
  actionValue: number | null;
  onRemove: () => void;
}

export function SortableBookItem({
  id,
  index,
  photo,
  storeName,
  subtitle,
  actionValue,
  onRemove,
}: SortableBookItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="overflow-hidden rounded-lg border bg-card"
    >
      <div className="relative aspect-square bg-muted">
        {photo && (
          <Image
            src={constructUrl(photo)}
            alt="Foto do PDV"
            fill
            sizes="200px"
            className="object-cover"
          />
        )}
        <span className="absolute left-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-xs font-semibold shadow">
          {index + 1}
        </span>
        <button
          type="button"
          className="absolute bottom-1 left-1 flex size-7 cursor-grab items-center justify-center rounded-md bg-background/90 shadow active:cursor-grabbing"
          title="Arraste para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-1 top-1 size-7"
          title="Remover do book"
          onClick={onRemove}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
      <div className="space-y-0.5 p-2">
        <p className="truncate text-xs font-medium">{storeName}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        {actionValue != null && (
          <p className="text-xs font-semibold text-primary">
            {formatBRL(actionValue)}
          </p>
        )}
      </div>
    </div>
  );
}
