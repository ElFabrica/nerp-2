import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import z from "zod";

export const moveKitchenOrder = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Mover pedido entre colunas",
    tags: ["kitchen"],
  })
  .input(
    z.object({
      id: z.string(),
      toColumnId: z.string(),
    }),
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ context, input, errors }) => {
    const organizationId = context.org.id;

    // Posição no fim da coluna destino (exclui o próprio card p/ ser idempotente).
    const last = await prisma.kitchenOrder.aggregate({
      where: { columnId: input.toColumnId, id: { not: input.id } },
      _max: { position: true },
    });

    // Atualiza somente o item, movendo-o para o final da lista da coluna destino.
    const result = await prisma.kitchenOrder.updateMany({
      where: { id: input.id, organizationId },
      data: {
        columnId: input.toColumnId,
        columnEnteredAt: new Date(),
        position: (last._max.position ?? -1) + 1,
      },
    });

    if (result.count === 0) {
      throw errors.NOT_FOUND({ message: "Pedido não encontrado!" });
    }

    return { success: true };
  });
