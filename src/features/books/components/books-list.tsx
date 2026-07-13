"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { constructUrl } from "@/hooks/use-construct-url";
import {
  DownloadIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useBooks } from "../hooks/use-books";
import { formatPeriod } from "../lib/book-format";
import { BookStatusBadge } from "./book-status-badge";
import { DeleteBookDialog } from "./delete-book-dialog";

export function BooksList() {
  const { books, isLoading } = useBooks();
  const [selectedId, setSelectedId] = useState("");
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Indústria</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-center">Fotos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 3 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Array.from({ length: 6 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!isLoading && books.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum book criado ainda.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <Link
                          href={`/books/${book.id}`}
                          className="font-medium hover:underline"
                        >
                          {book.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {book.supplierName ?? (
                          <span className="text-muted-foreground">Geral</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatPeriod(book.periodMonth, book.periodYear)}
                      </TableCell>
                      <TableCell className="text-center">
                        {book.itemsCount}
                      </TableCell>
                      <TableCell>
                        <BookStatusBadge status={book.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {book.status === "READY" && book.pdfKey && (
                            <Button asChild variant="outline" size="sm">
                              <a
                                href={constructUrl(book.pdfKey)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <DownloadIcon className="size-4" />
                                PDF
                              </a>
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVerticalIcon className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/books/${book.id}`}>
                                  <PencilIcon className="mr-2 size-4" />
                                  Abrir
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                  setSelectedId(book.id);
                                  setOpenDelete(true);
                                }}
                              >
                                <Trash2Icon className="mr-2 size-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DeleteBookDialog
        id={selectedId}
        open={openDelete}
        onOpenChange={setOpenDelete}
      />
    </>
  );
}
