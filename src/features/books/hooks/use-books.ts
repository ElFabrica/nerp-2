"use client";

import { orpc } from "@/lib/orpc";
import { uploadToR2 } from "@/lib/upload-to-r2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CoverBackground, CoverElement } from "../lib/cover-layout";

export function useBooks() {
  const { data, isPending } = useQuery(
    orpc.book.list.queryOptions({ input: {} }),
  );
  return { books: data?.books ?? [], isLoading: isPending };
}

export function useBook(id: string) {
  const query = useQuery({
    ...orpc.book.getOne.queryOptions({ input: { id } }),
    enabled: !!id,
    refetchInterval: (q) =>
      q.state.data?.status === "GENERATING" ? 2500 : false,
  });
  return { book: query.data, isLoading: query.isPending };
}

function useInvalidateBooks() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: orpc.book.list.key() });
    queryClient.invalidateQueries({ queryKey: orpc.book.getOne.key() });
  };
}

export function useCreateBook() {
  const invalidate = useInvalidateBooks();
  return useMutation(
    orpc.book.create.mutationOptions({
      onSuccess: () => {
        toast.success("Book criado");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useDeleteBook() {
  const invalidate = useInvalidateBooks();
  return useMutation(
    orpc.book.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Book excluído");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useImportBookPhotos() {
  const invalidate = useInvalidateBooks();
  return useMutation(
    orpc.book.importPhotos.mutationOptions({
      onSuccess: (result) => {
        toast.success(`${result.added} foto(s) adicionada(s)`);
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useAddBookPage() {
  const invalidate = useInvalidateBooks();
  return useMutation(
    orpc.book.addPage.mutationOptions({
      onSuccess: () => invalidate(),
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useRemoveBookItem() {
  const invalidate = useInvalidateBooks();
  return useMutation(
    orpc.book.removeItem.mutationOptions({
      onSuccess: () => invalidate(),
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useReorderBookItems() {
  const invalidate = useInvalidateBooks();
  return useMutation(
    orpc.book.reorderItems.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
        invalidate();
      },
    }),
  );
}

export function useGenerateBook() {
  const invalidate = useInvalidateBooks();
  return useMutation(
    orpc.book.generate.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          result.status === "READY"
            ? "Book gerado com sucesso!"
            : "Gerando o book em PDF…",
        );
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

// ── Capa / página final ──────────────────────────────────────────────────

export function useUpdateBookCoverLayout() {
  return useMutation(
    orpc.book.updateCoverLayout.mutationOptions({
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useDefaultCoverTemplate() {
  const query = useQuery(
    orpc.book.getDefaultCoverTemplate.queryOptions({ input: {} }),
  );
  return {
    template: query.data as {
      coverLayout: CoverElement[];
      closingLayout: CoverElement[];
      coverBackground: CoverBackground | null;
      closingBackground: CoverBackground | null;
    } | null | undefined,
    isLoading: query.isPending,
  };
}

export function useSetDefaultCoverTemplate() {
  return useMutation(
    orpc.book.setDefaultCoverTemplate.mutationOptions({
      onSuccess: () => toast.success("Definido como padrão da organização"),
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useSupplierBrands(supplierId: string | null) {
  const query = useQuery({
    ...orpc.book.listSupplierBrands.queryOptions({
      input: { supplierId: supplierId ?? "" },
    }),
    enabled: !!supplierId,
  });
  return { brands: query.data?.brands ?? [], isLoading: query.isPending };
}

export function useUploadCoverImage() {
  return useMutation({
    mutationFn: (file: File) => uploadToR2(file, true),
    onError: () => toast.error("Falha ao enviar imagem"),
  });
}
