"use client";

import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

export function useRemoveBookItem() {
  const invalidate = useInvalidateBooks();
  return useMutation(
    orpc.book.removeItem.mutationOptions({
      onSuccess: () => invalidate(),
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useGenerateBook() {
  const invalidate = useInvalidateBooks();
  return useMutation(
    orpc.book.generate.mutationOptions({
      onSuccess: () => {
        toast.success("Gerando o book em PDF…");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}
