import prisma from "@/lib/db";
import {
  computeAchievedByUserId,
  resolveUserIdByMemberId,
} from "./_sales-aggregation";
import { ALL_PERIOD_TYPES } from "./_schemas";

type SalesGoalPeriodType = (typeof ALL_PERIOD_TYPES)[number];

interface BuildRankingInput {
  periodType: SalesGoalPeriodType;
  periodStart?: string;
  includeInactiveBranches?: boolean;
}

// Fonte única do ranking: usada pela rota autenticada (ranking.list) e pela
// pública (ranking.publicList). Percentual atingido e valor faltante são sempre
// derivados aqui, nunca persistidos. Entry vinculada a um Member tem o vendido
// calculado das vendas (achievedSource AUTO); sem vínculo — ou com override
// manual (achievedIsManual) — vale o valor digitado (MANUAL).
export async function buildSalesGoalRanking(
  organizationId: string,
  input: BuildRankingInput,
) {
  const period = await prisma.salesGoalPeriod.findFirst({
    where: {
      organizationId,
      periodType: input.periodType,
      ...(input.periodStart
        ? { periodStart: new Date(input.periodStart) }
        : {}),
    },
    orderBy: { periodStart: "desc" },
    include: {
      branches: {
        where: input.includeInactiveBranches ? {} : { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { entries: true },
      },
    },
  });

  if (!period) return null;

  const linkedMemberIds = [
    ...new Set(
      period.branches
        .flatMap((branch) => branch.entries)
        .map((entry) => entry.memberId)
        .filter((memberId): memberId is string => memberId !== null),
    ),
  ];
  const userIdByMemberId = await resolveUserIdByMemberId(
    organizationId,
    linkedMemberIds,
  );
  const achievedByUserId =
    linkedMemberIds.length > 0
      ? await computeAchievedByUserId(
          organizationId,
          period.periodStart,
          period.periodEnd,
        )
      : new Map<string, number>();

  const branches = period.branches.map((branch) => {
    const entries = branch.entries
      .map((entry) => {
        const goalAmount = Number(entry.goalAmount);
        const linkedUserId = entry.memberId
          ? userIdByMemberId.get(entry.memberId)
          : undefined;
        const autoAchieved =
          linkedUserId !== undefined && !entry.achievedIsManual
            ? (achievedByUserId.get(linkedUserId) ?? 0)
            : null;
        const achievedAmount =
          autoAchieved !== null
            ? autoAchieved
            : entry.achievedAmount !== null
              ? Number(entry.achievedAmount)
              : null;
        const percentAchieved =
          achievedAmount !== null && goalAmount > 0
            ? (achievedAmount / goalAmount) * 100
            : null;
        const remainingAmount =
          achievedAmount !== null
            ? Math.max(goalAmount - achievedAmount, 0)
            : goalAmount;

        return {
          id: entry.id,
          externalCode: entry.externalCode,
          goalName: entry.goalName,
          sellerName: entry.sellerName,
          entryKind: entry.entryKind,
          goalAmount,
          achievedAmount,
          percentAchieved,
          remainingAmount,
          memberId: entry.memberId,
          photoUrl: entry.photoUrl,
          achievedSource:
            autoAchieved !== null ? ("AUTO" as const) : ("MANUAL" as const),
        };
      })
      .sort((a, b) => (b.percentAchieved ?? -1) - (a.percentAchieved ?? -1));

    const goalTotal = entries.reduce(
      (total, entry) => total + entry.goalAmount,
      0,
    );
    const achievedTotal = entries.reduce(
      (total, entry) => total + (entry.achievedAmount ?? 0),
      0,
    );

    return {
      id: branch.id,
      name: branch.name,
      isActive: branch.isActive,
      goalTotal,
      achievedTotal,
      entries,
    };
  });

  const goalTotal = branches.reduce(
    (total, branch) => total + branch.goalTotal,
    0,
  );
  const achievedTotal = branches.reduce(
    (total, branch) => total + branch.achievedTotal,
    0,
  );

  return {
    id: period.id,
    periodType: period.periodType,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    label: period.label,
    goalTotal,
    achievedTotal,
    branches,
  };
}

// Sem registro ainda? Devolve os defaults (nada persistido) pra UI já
// renderizar o formulário preenchido — evita side-effect de criar linha
// num GET.
export async function resolveSalesGoalRankingSettings(organizationId: string) {
  const settings = await prisma.salesGoalRankingSettings.findUnique({
    where: { organizationId },
  });

  if (!settings) {
    return {
      id: null,
      displayName: "Ranking de Equipes",
      theme: "GAMING" as const,
      activePeriodTypes: [...ALL_PERIOD_TYPES],
      soundEnabled: true,
      scoreSoundUrl: null,
      overtakeSoundUrl: null,
      victorySoundUrl: null,
      soundVolume: 0.6,
      prizes: [] as { position: number; label: string; imageUrl?: string }[],
    };
  }

  return {
    id: settings.id,
    displayName: settings.displayName,
    theme: settings.theme,
    activePeriodTypes: settings.activePeriodTypes,
    soundEnabled: settings.soundEnabled,
    scoreSoundUrl: settings.scoreSoundUrl,
    overtakeSoundUrl: settings.overtakeSoundUrl,
    victorySoundUrl: settings.victorySoundUrl,
    soundVolume: settings.soundVolume,
    prizes: settings.prizes as {
      position: number;
      label: string;
      imageUrl?: string;
    }[],
  };
}
