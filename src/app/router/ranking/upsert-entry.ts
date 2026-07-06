import z from "zod";
import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import { requireOrgAdmin } from "./_access";
import { entryKindSchema } from "./_schemas";

const upsertSalesGoalEntryInputSchema = z.object({
  entryId: z.string(),
  goalName: z.string().min(1).optional(),
  goalAmount: z.number().nonnegative().optional(),
  achievedAmount: z.number().nonnegative().nullable().optional(),
  entryKind: entryKindSchema.optional(),
  memberId: z.string().nullable().optional(),
});

// Entry vinculada a um Member tem o vendido calculado das vendas — o
// achievedAmount manual é descartado na escrita e fica latente como
// fallback caso a entry seja desvinculada depois.
export const upsertSalesGoalEntry = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Atualizar meta/vendido/vínculo de uma entry",
    tags: ["ranking"],
  })
  .input(upsertSalesGoalEntryInputSchema)
  .handler(async ({ input, context, errors }) => {
    await requireOrgAdmin(context.org.id, context.user.id);

    const entry = await prisma.salesGoalEntry.findFirst({
      where: {
        id: input.entryId,
        branch: { period: { organizationId: context.org.id } },
      },
    });
    if (!entry) {
      throw errors.NOT_FOUND({ message: "Meta não encontrada." });
    }

    if (input.memberId) {
      const member = await prisma.member.findFirst({
        where: { id: input.memberId, organizationId: context.org.id },
        select: { id: true },
      });
      if (!member) {
        throw errors.NOT_FOUND({
          message: "Membro não encontrado nesta organização.",
        });
      }
    }

    const resultingMemberId =
      input.memberId !== undefined ? input.memberId : entry.memberId;
    const isLinkedToMember = resultingMemberId !== null;

    const updated = await prisma.salesGoalEntry.update({
      where: { id: input.entryId },
      data: {
        goalName: input.goalName,
        goalAmount: input.goalAmount,
        achievedAmount: isLinkedToMember ? undefined : input.achievedAmount,
        entryKind: input.entryKind,
        memberId: input.memberId,
      },
    });

    return {
      id: updated.id,
      externalCode: updated.externalCode,
      goalName: updated.goalName,
      sellerName: updated.sellerName,
      entryKind: updated.entryKind,
      goalAmount: Number(updated.goalAmount),
      achievedAmount:
        updated.achievedAmount !== null ? Number(updated.achievedAmount) : null,
      memberId: updated.memberId,
    };
  });
