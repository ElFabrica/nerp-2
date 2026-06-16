import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import z from "zod";

// Arquiva (ou restaura) um pedido. Arquivado some do board e vai p/ a área de
// arquivados; não conta tempo nem aparece na TV (continua na coluna atual).
export const setArchivedKitchenOrder = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Arquivar/restaurar pedido da cozinha",
    tags: ["kitchen"],
  })
  .input(
    z.object({
      id: z.string(),
      archived: z.boolean(),
    }),
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ context, input, errors }) => {
    const result = await prisma.kitchenOrder.updateMany({
      where: { id: input.id, organizationId: context.org.id },
      data: { archivedAt: input.archived ? new Date() : null },
    });

    if (result.count === 0) {
      throw errors.NOT_FOUND({ message: "Pedido não encontrado!" });
    }

    return { success: true };
  });
