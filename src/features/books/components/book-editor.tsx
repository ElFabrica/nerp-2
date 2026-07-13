"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { constructUrl } from "@/hooks/use-construct-url";
import {
  ArrowLeft,
  DownloadIcon,
  ImagePlusIcon,
  SparklesIcon,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  useBook,
  useGenerateBook,
  useRemoveBookItem,
} from "../hooks/use-books";
import { formatPeriod } from "../lib/book-format";
import { BookStatusBadge } from "./book-status-badge";
import { ImportPhotosDialog } from "./import-photos-dialog";

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
  const [openImport, setOpenImport] = useState(false);

  if (isLoading || !book) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const isGenerating = book.status === "GENERATING";
  const existingPhotoIds = book.items.map((item) => item.pdvPhotoId);

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
              {book.supplierName} ·{" "}
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
          <Button
            onClick={() => generateBook.mutate({ id: bookId })}
            disabled={
              isGenerating || generateBook.isPending || book.items.length === 0
            }
          >
            {(isGenerating || generateBook.isPending) && <Spinner />}
            <SparklesIcon className="size-4" />
            {isGenerating ? "Gerando…" : "Gerar PDF"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium">
            {book.items.length} foto(s) no book
          </p>
        </CardHeader>
        <CardContent>
          {book.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma foto adicionada. Use “Importar fotos” para montar o book.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {book.items.map((item) => (
                <div
                  key={item.pdvPhotoId}
                  className="overflow-hidden rounded-lg border"
                >
                  <div className="relative aspect-square bg-muted">
                    {item.photos[0] && (
                      <Image
                        src={constructUrl(item.photos[0])}
                        alt="Foto do PDV"
                        fill
                        sizes="200px"
                        className="object-cover"
                      />
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute right-1 top-1 size-7"
                      title="Remover do book"
                      onClick={() =>
                        removeItem.mutate({
                          bookId,
                          pdvPhotoId: item.pdvPhotoId,
                        })
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-0.5 p-2">
                    <p className="truncate text-xs font-medium">
                      {item.storeName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[item.section, item.code].filter(Boolean).join(" · ") ||
                        formatDate(item.capturedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
