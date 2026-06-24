import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PersonType } from "@/generated/prisma/enums";
import { toast } from "sonner";

interface UseSupplierProps {
  personType?: PersonType;
}

export function useSupplier({ personType }: UseSupplierProps = {}) {
  const { data, isPending } = useQuery(
    orpc.supplier.list.queryOptions({
      input: { personType },
    })
  );

  return {
    suppliers: data?.suppliers || [],
    isLoading: isPending,
  };
}

export const useQuerySupplier = (id: string) => {
  const { data, isPending } = useQuery(
    orpc.supplier.getOne.queryOptions({
      input: { id },
    })
  );

  return {
    supplier: data?.supplier,
    isLoading: isPending,
  };
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.supplier.create.mutationOptions({
      onSuccess: () => {
        toast.success("Fornecedor criado com sucesso");
        queryClient.invalidateQueries(
          orpc.supplier.list.queryOptions({ input: {} })
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.supplier.update.mutationOptions({
      onSuccess: (data) => {
        toast.success("Fornecedor atualizado com sucesso");
        queryClient.invalidateQueries(
          orpc.supplier.list.queryOptions({ input: {} })
        );
        queryClient.invalidateQueries(
          orpc.supplier.getOne.queryOptions({
            input: { id: data.supplier.id },
          })
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.supplier.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Fornecedor deletado com sucesso");
        queryClient.invalidateQueries(
          orpc.supplier.list.queryOptions({ input: {} })
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );
};
