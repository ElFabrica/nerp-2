import { orpc } from "@/lib/orpc";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

interface useQuerySalesProps {
  dateInit?: Date;
  dateEnd?: Date;
  methodPayment?: string;
  status?: string;
  minValue?: number;
  maxValue?: number;
}

export function useQuerySales({
  dateInit,
  dateEnd,
  methodPayment,
  status,
  minValue,
  maxValue,
}: useQuerySalesProps) {
  const { data, isLoading } = useQuery(
    orpc.sales.list.queryOptions({
      input: {
        dateInit,
        dateEnd,
        methodPayment,
        status,
        minValue,
        maxValue,
      },
    }),
  );

  return {
    data: data?.sales || [],
    isLoadingSales: isLoading,
  };
}

export const useMutationCreateSale = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.sales.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.products.list.queryKey({
            input: {
              page: 1,
              pageSize: 12,
            },
          }),
        });
        toast.success("Venda criada com sucesso!");
      },
      onError: () => {
        toast.error("Erro ao criar venda!");
      },
    }),
  );
};

interface useQuerySaleProps {
  saleId: string;
}

export const useQuerySale = ({ saleId }: useQuerySaleProps) => {
  const { data, isLoading } = useQuery(
    orpc.sales.get.queryOptions({
      input: {
        saleId,
      },
    }),
  );

  return {
    data,
    isLoadingSale: isLoading,
  };
};

interface PrefetchSaleProps {
  saleId: string;
  queryClient: QueryClient;
}

export const PrefetchSale = ({ saleId, queryClient }: PrefetchSaleProps) => {
  return queryClient.prefetchQuery(
    orpc.sales.get.queryOptions({
      input: {
        saleId,
      },
    }),
  );
};

export function useDeleteSale() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.sales.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.sales.list.queryKey({
            input: {},
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.products.list.queryKey({
            input: {
              page: 1,
              pageSize: 12,
            },
          }),
        });
      },
    }),
  );
}
