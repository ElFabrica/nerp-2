"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { constructUrl } from "@/hooks/use-construct-url";
import {
  ArrowLeft,
  DownloadIcon,
  ImagePlusIcon,
  SparklesIcon,
  TriangleAlert,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useBook, useGenerateBook } from "../hooks/use-books";
import { formatPeriod } from "../lib/book-format";
import { BookPagesList } from "./book-pages/book-pages-list";
import { BookStatusBadge } from "./book-status-badge";
import { CoverEditor } from "./cover-editor/cover-editor";
import { ImportPhotosDialog } from "./import-photos-dialog";

interface BookEditorProps {
  bookId: string;
}

export function BookEditor({ bookId }: BookEditorProps) {
  const { book, isLoading } = useBook(bookId);
  const generateBook = useGenerateBook();
  const [openImport, setOpenImport] = useState(false);
  const [pendingMode, setPendingMode] = useState<"queue" | "sync" | null>(null);

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
        <div className="flex flex-wrap items-center gap-2">
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

      <Tabs defaultValue="photos">
        <TabsList>
          <TabsTrigger value="photos">Páginas</TabsTrigger>
          <TabsTrigger value="cover">Capa e Página Final</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-4">
          <BookPagesList
            bookId={bookId}
            periodMonth={book.periodMonth}
            periodYear={book.periodYear}
            items={book.items}
            industryLogo={book.supplierLogo}
            organizationName={book.organizationName}
          />
        </TabsContent>

        <TabsContent value="cover" className="mt-4">
          <CoverEditor
            bookId={bookId}
            supplierId={book.supplierId}
            coverLayout={book.coverLayout}
            closingLayout={book.closingLayout}
            coverBackground={book.coverBackground}
            closingBackground={book.closingBackground}
          />
        </TabsContent>
      </Tabs>

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
