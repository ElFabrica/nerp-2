"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc";

// Enquanto sincroniza, pergunta de 3 em 3s para o badge sair de "sincronizando"
// sozinho; parado, 60s basta — o cron roda de 15 em 15 min.
const POLL_WHILE_SYNCING_MS = 3_000;
const POLL_IDLE_MS = 60_000;

export function useErpSyncStatus() {
  return useQuery(
    orpc.erpSync.status.queryOptions({
      input: {},
      refetchInterval: (query) =>
        query.state.data?.configured && query.state.data.isSyncing
          ? POLL_WHILE_SYNCING_MS
          : POLL_IDLE_MS,
    }),
  );
}

export function useRunErpSync() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.erpSync.run.mutationOptions({
      onSuccess: () => {
        toast.success("Sincronização iniciada");
        // O status muda primeiro (vira "sincronizando"); o ranking só depois que
        // o job terminar, mas invalidar os dois deixa a tela reagir sozinha.
        queryClient.invalidateQueries({ queryKey: orpc.erpSync.key() });
        queryClient.invalidateQueries({ queryKey: orpc.ranking.key() });
      },
      onError: (error) => toast.error(error.message),
    }),
  );
}
