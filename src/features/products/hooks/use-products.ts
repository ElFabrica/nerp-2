import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseProductsProps {
  category?: string[];
  sku?: string;
  minValue?: string;
  maxValue?: string;
  dateInit?: Date;
  dateEnd?: Date;
  page?: number;
  pageSize?: number;
}

export function useProducts({
  page = 1,
  pageSize = 2,
  category,
  sku,
  minValue,
  maxValue,
  dateInit,
  dateEnd,
}: UseProductsProps) {
  const { data, isLoading } = useQuery(
    orpc.products.list.queryOptions({
      input: {
        category,
        sku,
        minValue,
        maxValue,
        dateInit,
        dateEnd,
        page,
        pageSize,
      },
    }),
  );
  return {
    data: data?.products || [],
    page: data?.page,
    pageSize: data?.pageSize,
    totalCount: data?.totalCount,
    totalPages: data?.totalPages,
    hasNextPage: data?.hasNextPage,
    hasPreviousPage: data?.hasPreviousPage,
    isLoading,
  };
}

interface useQueryProductsOfCartProps {
  subdomain: string;
  productIds: string[];
}

export function useQueryProductsOfCart({
  subdomain,
  productIds,
}: useQueryProductsOfCartProps) {
  const { data, isLoading } = useQuery(
    orpc.catalogSettings.listProductsOfCart.queryOptions({
      input: {
        subdomain,
        productIds,
      },
    }),
  );
  return {
    data: data?.products || [],
    isLoading,
  };
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.products.create.mutationOptions({
      onSuccess: () => {
        // router.push("/produtos");

        queryClient.invalidateQueries(
          orpc.products.list.queryOptions({
            input: { page: 1, pageSize: 10 },
          }),
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );
};
