"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { constructUrl } from "@/hooks/use-construct-url";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowLeft,
  DownloadIcon,
  ImagePlusIcon,
  SparklesIcon,
  TriangleAlert,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  useBook,
  useGenerateBook,
  useRemoveBookItem,
  useReorderBookItems,
} from "../hooks/use-books";
import { formatPeriod } from "../lib/book-format";
import { BookStatusBadge } from "./book-status-badge";
import { ImportPhotosDialog } from "./import-photos-dialog";
import { SortableBookItem } from "./sortable-book-item";

interface BookEditorProps {
  bookId: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function BookEditor({ bookId }: BookEditorProps) {
  const { book, isLoading } = useBook(bookId);
  const generateBook = useGenerateBook();
  const removeItem = useRemoveBookItem();
  const reorderItems = useReorderBookItems();
  const [openImport, setOpenImport] = useState(false);
  const [pendingMode, setPendingMode] = useState<"queue" | "sync" | null>(null);

  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  useEffect(() => {
    if (book) setOrderedIds(book.items.map((item) => item.pdvPhotoId));
  }, [book]);

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

  if (isLoading || !book) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const isGenerating = book.status === "GENERATING";
  const isFailed = book.status === "FAILED";
  const hasItems = book.items.length > 0;

  const runGenerate = (sync: boolean) => {
    setPendingMode(sync ? "sync" : "queue");
    generateBook.mutate(
      { id: bookId, sync: sync || undefined },
      { onSettled: () => setPendingMode(null) },
    );
  };

  const existingPhotoIds = book.items.map((item) => item.pdvPhotoId);
  const itemsById = new Map(book.items.map((item) => [item.pdvPhotoId, item]));
  const orderedItems = orderedIds
    .map((id) => itemsById.get(id))
    .filter((item): item is NonNullable<typeof item> => !!item);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/books" aria-label="Voltar para books">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{book.name}</h1>
              <BookStatusBadge status={book.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {book.supplierName ? `${book.supplierName} · ` : "Book geral · "}
              {formatPeriod(book.periodMonth, book.periodYear)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {book.status === "READY" && book.pdfKey && (
            <Button asChild variant="outline">
              <a
                href={constructUrl(book.pdfKey)}
                target="_blank"
                rel="noreferrer"
              >
                <DownloadIcon className="size-4" />
                Baixar PDF
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpenImport(true)}>
            <ImagePlusIcon className="size-4" />
            Importar fotos
          </Button>
          {(isGenerating || isFailed) && (
            <Button
              variant="outline"
              onClick={() => runGenerate(true)}
              disabled={generateBook.isPending || !hasItems}
              title="Renderiza o PDF na hora, sem passar pela fila"
            >
              {pendingMode === "sync" ? (
                <Spinner />
              ) : (
                <Zap className="size-4" />
              )}
              Gerar agora
            </Button>
          )}
          <Button
            onClick={() => runGenerate(false)}
            disabled={isGenerating || generateBook.isPending || !hasItems}
          >
            {pendingMode === "queue" ? (
              <Spinner />
            ) : (
              <SparklesIcon className="size-4" />
            )}
            {isGenerating
              ? "Gerando…"
              : isFailed
                ? "Tentar novamente"
                : "Gerar PDF"}
          </Button>
        </div>
      </div>

      {isFailed && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            A geração do PDF falhou. Clique em <strong>Tentar novamente</strong>{" "}
            ou em <strong>Gerar agora</strong> para renderizar sem a fila.
          </p>
        </div>
      )}

      {isGenerating && (
        <p className="text-sm text-muted-foreground">
          Gerando o PDF… Se estiver demorando, use <strong>Gerar agora</strong>{" "}
          para renderizar imediatamente.
        </p>
      )}

      <Card>
        <CardHeader>
          <p className="text-sm font-medium">
            {book.items.length} foto(s) no book
          </p>
          {book.items.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Arraste pela alça para definir a ordem das páginas no PDF.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {book.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma foto adicionada. Use “Importar fotos” para montar o book.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedIds}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {orderedItems.map((item, index) => (
                    <SortableBookItem
                      key={item.pdvPhotoId}
                      id={item.pdvPhotoId}
                      index={index}
                      photo={item.photos[0]}
                      storeName={item.storeName}
                      subtitle={
                        [item.section, item.code].filter(Boolean).join(" · ") ||
                        formatDate(item.capturedAt)
                      }
                      actionValue={item.actionValue}
                      onRemove={() =>
                        removeItem.mutate({
                          bookId,
                          pdvPhotoId: item.pdvPhotoId,
                        })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <ImportPhotosDialog
        open={openImport}
        onOpenChange={setOpenImport}
        bookId={bookId}
        defaultSupplierId={book.supplierId}
        existingPhotoIds={existingPhotoIds}
      />
    </div>
  );
}
