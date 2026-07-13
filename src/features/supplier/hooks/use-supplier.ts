import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PersonType } from "@/generated/prisma/enums";
import { toast } from "sonner";

interface UseSupplierProps {
  personType?: PersonType;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useSupplier({
  personType,
  search,
  page = 1,
  pageSize = 10,
}: UseSupplierProps = {}) {
  const { data, isPending } = useQuery(
    orpc.supplier.list.queryOptions({
      input: { personType, search, page, pageSize },
    })
  );

  return {
    suppliers: data?.suppliers || [],
    totalCount: data?.totalCount ?? 0,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    totalPages: data?.totalPages ?? 1,
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
        queryClient.invalidateQueries({
          queryKey: orpc.supplier.list.key(),
        });
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
        queryClient.invalidateQueries({
          queryKey: orpc.supplier.list.key(),
        });
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
        queryClient.invalidateQueries({
          queryKey: orpc.supplier.list.key(),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );
};
