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

export const listSalesGoalEvolution = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "GET",
    summary: "Evolução de meta x vendido por período",
    tags: ["ranking"],
  })
  .input(z.object({ periodType: periodTypeSchema.optional() }).optional())
  .handler(async ({ input, context }) => {
    const periods = await prisma.salesGoalPeriod.findMany({
      where: {
        organizationId: context.org.id,
        ...(input?.periodType ? { periodType: input.periodType } : {}),
      },
      orderBy: { periodStart: "asc" },
      include: { branches: { include: { entries: true } } },
    });

    const allMemberIds = [
      ...new Set(
        periods
          .flatMap((period) => period.branches)
          .flatMap((branch) => branch.entries)
          .map((entry) => entry.memberId)
          .filter((memberId): memberId is string => memberId !== null),
      ),
    ];
    const userIdByMemberId = await resolveUserIdByMemberId(
      context.org.id,
      allMemberIds,
    );

    return Promise.all(
      periods.map(async (period) => {
        const allEntries = period.branches.flatMap((branch) => branch.entries);
        const hasLinkedEntry = allEntries.some(
          (entry) =>
            entry.memberId !== null && userIdByMemberId.has(entry.memberId),
        );
        const achievedByUserId = hasLinkedEntry
          ? await computeAchievedByUserId(
              context.org.id,
              period.periodStart,
              period.periodEnd,
            )
          : new Map<string, number>();

        const goalTotal = allEntries.reduce(
          (total, entry) => total + Number(entry.goalAmount),
          0,
        );
        const achievedTotal = allEntries.reduce((total, entry) => {
          const linkedUserId = entry.memberId
            ? userIdByMemberId.get(entry.memberId)
            : undefined;
          if (linkedUserId)
            return total + (achievedByUserId.get(linkedUserId) ?? 0);
          return (
            total +
            (entry.achievedAmount !== null ? Number(entry.achievedAmount) : 0)
          );
        }, 0);

        return {
          periodId: period.id,
          periodType: period.periodType,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          label: period.label,
          goalTotal,
          achievedTotal,
        };
      }),
    );
  });
