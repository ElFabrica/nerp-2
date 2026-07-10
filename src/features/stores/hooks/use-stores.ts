"use client";

import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useStores(search?: string) {
  const { data, isPending } = useQuery(
    orpc.store.list.queryOptions({ input: { search } }),
  );

  return { stores: data?.stores ?? [], isLoading: isPending };
}

export function useStore(id: string) {
  const { data, isPending } = useQuery({
    ...orpc.store.getOne.queryOptions({ input: { id } }),
    enabled: !!id,
  });

  return { store: data?.store, isLoading: isPending };
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.store.create.mutationOptions({
      onSuccess: () => {
        toast.success("Loja criada com sucesso");
        queryClient.invalidateQueries({ queryKey: orpc.store.list.key() });
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.store.update.mutationOptions({
      onSuccess: () => {
        toast.success("Loja atualizada com sucesso");
        queryClient.invalidateQueries({ queryKey: orpc.store.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.store.getOne.key() });
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}

export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.store.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Loja excluída com sucesso");
        queryClient.invalidateQueries({ queryKey: orpc.store.list.key() });
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}
