import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import z from "zod";

export const createKitchenOrder = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Registrar pedido na cozinha",
    tags: ["kitchen"],
  })
  .input(
    z.object({
      tableNumber: z.string().min(1),
      dishName: z.string().min(1),
      productId: z.string().optional(),
      estimatedMinutes: z.number().int().positive().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ context, input }): Promise<{ id: string }> => {
    let estimatedMinutes = input.estimatedMinutes ?? null;

    if (estimatedMinutes === null && input.productId) {
      const product = await prisma.product.findFirst({
        where: {
          id: input.productId,
          organizationId: context.org.id,
        },
        select: { prepTimeMinutes: true },
      });
      estimatedMinutes = product?.prepTimeMinutes ?? null;
    }

    const order = await prisma.kitchenOrder.create({
      data: {
        organizationId: context.org.id,
        tableNumber: input.tableNumber,
        dishName: input.dishName,
        productId: input.productId,
        estimatedMinutes,
        notes: input.notes,
        status: "EM_PREPARO",
        createdById: context.session.userId,
      },
    });

    return { id: order.id };
  });
