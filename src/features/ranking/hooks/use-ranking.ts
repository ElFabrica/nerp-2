"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import type { SalesGoalPeriodType } from "../lib/sales-goal-xlsx-parser";

export function useSalesGoalRanking(
  periodType: SalesGoalPeriodType,
  periodStart?: string,
  includeInactiveBranches?: boolean,
) {
  return useQuery(
    orpc.ranking.list.queryOptions({
      input: { periodType, periodStart, includeInactiveBranches },
      // vendido AUTO muda fora da tela (vendas concluídas no PDV) — polling
      // mantém Modo TV e sons reagindo sem interação
      refetchInterval: 30_000,
    }),
  );
}

export function useSalesGoalPeriods(periodType?: SalesGoalPeriodType) {
  return useQuery(
    orpc.ranking.listPeriods.queryOptions({ input: { periodType } }),
  );
}

export function useImportSalesGoalRanking() {
  const qc = useQueryClient();
  return useMutation(
    orpc.ranking.import.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.ranking.key() }),
    }),
  );
}

export function useUpsertSalesGoalEntry() {
  const qc = useQueryClient();
  return useMutation(
    orpc.ranking.upsertEntry.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.ranking.key() }),
    }),
  );
}

export function useDeleteSalesGoalEntry() {
  const qc = useQueryClient();
  return useMutation(
    orpc.ranking.deleteEntry.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.ranking.key() }),
    }),
  );
}

export function useUpdateSalesGoalBranch() {
  const qc = useQueryClient();
  return useMutation(
    orpc.ranking.updateBranch.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.ranking.key() }),
    }),
  );
}

export function useSalesGoalEvolution(periodType?: SalesGoalPeriodType) {
  return useQuery(
    orpc.ranking.evolution.queryOptions({ input: { periodType } }),
  );
}

export function useSalesGoalRankingSettings() {
  return useQuery(orpc.ranking.settings.get.queryOptions({ input: {} }));
}

export function useUpdateSalesGoalRankingSettings() {
  const qc = useQueryClient();
  return useMutation(
    orpc.ranking.settings.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.ranking.key() }),
    }),
  );
}
