import z from "zod";
import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import {
  computeAchievedByUserId,
  resolveUserIdByMemberId,
} from "./_sales-aggregation";
import { periodTypeSchema } from "./_schemas";

const listSalesGoalRankingInputSchema = z.object({
  periodType: periodTypeSchema,
  periodStart: z.string().optional(),
  includeInactiveBranches: z.boolean().optional(),
});

// Percentual atingido e valor faltante são sempre derivados aqui, nunca
// persistidos. Entry vinculada a um Member tem o vendido calculado das
// vendas (achievedSource AUTO); sem vínculo, vale o valor manual (MANUAL).
export const listSalesGoalRanking = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "GET",
    summary: "Ranking de metas do período",
    tags: ["ranking"],
  })
  .input(listSalesGoalRankingInputSchema)
  .handler(async ({ input, context }) => {
    const period = await prisma.salesGoalPeriod.findFirst({
      where: {
        organizationId: context.org.id,
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
      context.org.id,
      linkedMemberIds,
    );
    const achievedByUserId =
      linkedMemberIds.length > 0
        ? await computeAchievedByUserId(
            context.org.id,
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
          const achievedAmount = linkedUserId
            ? (achievedByUserId.get(linkedUserId) ?? 0)
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
            achievedSource: linkedUserId
              ? ("AUTO" as const)
              : ("MANUAL" as const),
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
  });
