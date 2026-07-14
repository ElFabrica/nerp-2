"use client";

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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  useAddBookPage,
  useRemoveBookItem,
  useReorderBookItems,
} from "../../hooks/use-books";
import { formatPeriod } from "../../lib/book-format";
import { AddPageButton } from "./add-page-button";
import { BookPageCard, type BookPageItem } from "./book-page-card";

interface BookPagesListProps {
  bookId: string;
  periodMonth: number;
  periodYear: number;
  items: (BookPageItem & { order: number })[];
  industryLogo?: string | null;
  supplierManager?: string | null;
  organizationName?: string | null;
}

export function BookPagesList({
  bookId,
  periodMonth,
  periodYear,
  items,
  industryLogo,
  supplierManager,
  organizationName,
}: BookPagesListProps) {
  const addPage = useAddBookPage();
  const removeItem = useRemoveBookItem();
  const reorderItems = useReorderBookItems();

  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  useEffect(() => {
    setOrderedIds(items.map((item) => item.pdvPhotoId));
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.indexOf(String(active.id));
    const newIndex = orderedIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(next);
    reorderItems.mutate({ bookId, orderedPdvPhotoIds: next });
  };

  const itemsById = new Map(items.map((item) => [item.pdvPhotoId, item]));
  const orderedItems = orderedIds
    .map((id) => itemsById.get(id))
    .filter((item): item is (typeof items)[number] => !!item);

  const periodLabel = formatPeriod(periodMonth, periodYear);

  if (orderedItems.length === 0) {
    return (
      <div className="space-y-3">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma página ainda. Clique em "Adicionar página" e escolha a
            loja pra começar a montar o book.
          </CardContent>
        </Card>
        <AddPageButton
          isPending={addPage.isPending}
          onSelectStore={(storeId) => addPage.mutate({ bookId, storeId })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {orderedItems.map((item, index) => (
              <BookPageCard
                key={item.pdvPhotoId}
                item={item}
                periodLabel={periodLabel}
                position={index + 1}
                total={orderedItems.length}
                industryLogo={industryLogo}
                supplierManager={supplierManager}
                organizationName={organizationName}
                onRemove={() =>
                  removeItem.mutate({ bookId, pdvPhotoId: item.pdvPhotoId })
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AddPageButton
        isPending={addPage.isPending}
        onSelectStore={(storeId) => addPage.mutate({ bookId, storeId })}
      />
    </div>
  );
}
