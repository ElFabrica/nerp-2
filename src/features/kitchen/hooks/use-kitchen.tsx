import { orpc } from "@/lib/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const POLL_MS = 5000;

export type KitchenOrder = {
  id: string;
  columnId: string;
  tableNumber: string;
  dishName: string;
  estimatedMinutes: number | null;
  position: number;
  createdAt: string;
  columnEnteredAt: string;
};

// Uma query só com todos os pedidos ativos; o board agrupa por columnId no cliente.
const ordersInput = {} as const;
const ordersQueryKey = orpc.kitchen.list.queryKey({ input: ordersInput });

export function useQueryKitchenOrders() {
  return useQuery(
    orpc.kitchen.list.queryOptions({
      input: ordersInput,
      refetchInterval: POLL_MS, // polling: substitui websockets
    }),
  );
}

export function useMutationCreateKitchenOrder() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.kitchen.create.mutationOptions({
      onSuccess: () => {
        toast.success("Pedido registrado!");
        queryClient.invalidateQueries({ queryKey: orpc.kitchen.list.key() });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );
}

export function useMutationMoveKitchenOrder() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.kitchen.move.mutationOptions({
      // Update otimista: move o card de coluna imediatamente, evitando o "pisca"
      // até o próximo polling. Rollback em onError (ex.: estourou WIP no servidor).
      onMutate: async ({ id, toColumnId }) => {
        await queryClient.cancelQueries({ queryKey: ordersQueryKey });
        const previous =
          queryClient.getQueryData<KitchenOrder[]>(ordersQueryKey);

        queryClient.setQueryData<KitchenOrder[]>(ordersQueryKey, (old) =>
          old?.map((order) =>
            order.id === id
              ? {
                  ...order,
                  columnId: toColumnId,
                  columnEnteredAt: new Date().toISOString(),
                }
              : order,
          ),
        );

        return { previous };
      },
      onError: (error, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(ordersQueryKey, context.previous);
        }
        toast.error(error.message);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: orpc.kitchen.list.key() });
      },
    }),
  );
}
