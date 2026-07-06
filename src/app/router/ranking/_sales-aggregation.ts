import prisma from "@/lib/db";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Vendido automático: soma de Sale COMPLETED por usuário criador dentro da
// janela do período. `periodEnd` chega como 00:00 do último dia (formato do
// parser da planilha), por isso a janela usa `lt periodEnd + 1 dia`. Vendas
// concluídas sem `completedAt` caem para `createdAt`.
export async function computeAchievedByUserId(
  organizationId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<Map<string, number>> {
  const endExclusive = new Date(periodEnd.getTime() + ONE_DAY_MS);

  const salesByCreator = await prisma.sale.groupBy({
    by: ["createdById"],
    where: {
      organizationId,
      status: "COMPLETED",
      createdById: { not: null },
      OR: [
        { completedAt: { gte: periodStart, lt: endExclusive } },
        {
          completedAt: null,
          createdAt: { gte: periodStart, lt: endExclusive },
        },
      ],
    },
    _sum: { total: true },
  });

  const achievedByUserId = new Map<string, number>();
  for (const group of salesByCreator) {
    if (group.createdById) {
      achievedByUserId.set(group.createdById, Number(group._sum.total ?? 0));
    }
  }
  return achievedByUserId;
}

export async function resolveUserIdByMemberId(
  organizationId: string,
  memberIds: string[],
): Promise<Map<string, string>> {
  if (memberIds.length === 0) return new Map();

  const members = await prisma.member.findMany({
    where: { id: { in: memberIds }, organizationId },
    select: { id: true, userId: true },
  });
  return new Map(members.map((member) => [member.id, member.userId]));
}
