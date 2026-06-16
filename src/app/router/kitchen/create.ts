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
      columnId: z.string().optional(), // padrão: a coluna isInitial da org
    }),
  )
  .output(z.object({ id: z.string() }))
  .handler(async ({ context, input, errors }) => {
    const organizationId = context.org.id;

    let estimatedMinutes = input.estimatedMinutes ?? null;

    if (estimatedMinutes === null && input.productId) {
      const product = await prisma.product.findFirst({
        where: {
          id: input.productId,
          organizationId,
        },
        select: { prepTimeMinutes: true },
      });
      estimatedMinutes = product?.prepTimeMinutes ?? null;
    }

    // Resolve a coluna destino: columnId informado ou a coluna isInitial da org.
    const column = input.columnId
      ? await prisma.kitchenColumn.findFirst({
          where: { id: input.columnId, organizationId },
          select: { id: true },
        })
      : await prisma.kitchenColumn.findFirst({
          where: { organizationId, isInitial: true },
          select: { id: true },
        });

    if (!column) {
      throw errors.BAD_REQUEST({
        message: input.columnId
          ? "Coluna não encontrada!"
          : "Nenhuma coluna de entrada configurada para a cozinha!",
      });
    }

    const last = await prisma.kitchenOrder.aggregate({
      where: { columnId: column.id },
      _max: { position: true },
    });

    const order = await prisma.kitchenOrder.create({
      data: {
        organizationId,
        columnId: column.id,
        tableNumber: input.tableNumber,
        dishName: input.dishName,
        productId: input.productId,
        estimatedMinutes,
        notes: input.notes,
        position: (last._max.position ?? -1) + 1,
        columnEnteredAt: new Date(),
        createdById: context.session.userId,
      },
    });

    return { id: order.id };
  });
