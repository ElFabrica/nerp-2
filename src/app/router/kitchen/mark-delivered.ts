import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import z from "zod";

export const markKitchenOrderDelivered = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Marcar pedido como entregue",
    tags: ["kitchen"],
  })
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .handler(
    async ({ context, input, errors }): Promise<{ success: boolean }> => {
      const result = await prisma.kitchenOrder.updateMany({
        where: {
          id: input.id,
          organizationId: context.org.id,
          status: "PRONTO",
        },
        data: {
          status: "ENTREGUE",
          deliveredAt: new Date(),
        },
      });

      if (result.count === 0) {
        throw errors.NOT_FOUND({
          message: "Pedido não encontrado ou não está pronto!",
        });
      }

      return { success: true };
    },
  );
