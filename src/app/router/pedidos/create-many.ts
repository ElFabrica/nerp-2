import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import z from "zod";

export const createKitchenOrderMany = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Registrar vários pedidos na cozinha (mesma mesa)",
    tags: ["kitchen"],
  })
  .input(
    z.object({
      tableNumber: z.string().min(1),
      columnId: z.string().optional(), // padrão: a coluna isInitial da org
      items: z
        .array(
          z.object({
            dishName: z.string().min(1),
            productId: z.string().optional(),
            quantity: z.number().int().positive().default(1),
            estimatedMinutes: z.number().int().positive().optional(),
            notes: z.string().optional(),
          }),
        )
        .min(1),
    }),
  )
  .output(z.object({ count: z.number() }))
  .handler(async ({ context, input, errors }) => {
    const organizationId = context.org.id;

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

    // Tempo de preparo: snapshot do prepTimeMinutes de cada produto vinculado.
    // Uma única query p/ todos os produtos, evitando N consultas.
    const productIds = input.items
      .map((item) => item.productId)
      .filter((id): id is string => Boolean(id));

    const prepTimeByProduct = new Map<string, number | null>();
    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, organizationId },
        select: { id: true, prepTimeMinutes: true },
      });
      for (const product of products) {
        prepTimeByProduct.set(product.id, product.prepTimeMinutes);
      }
    }

    // Posição inicial na coluna (incrementa por item).
    const last = await prisma.kitchenOrder.aggregate({
      where: { columnId: column.id },
      _max: { position: true },
    });
    let position = (last._max.position ?? -1) + 1;

    const columnEnteredAt = new Date();

    const data = input.items.map((item) => {
      const estimatedMinutes =
        item.estimatedMinutes ??
        (item.productId ? prepTimeByProduct.get(item.productId) ?? null : null);

      // Quando qtd > 1, registra no nome do prato (padrão de create-orders-from-sale).
      const dishName =
        item.quantity > 1 ? `${item.quantity}x ${item.dishName}` : item.dishName;

      return {
        organizationId,
        columnId: column.id,
        tableNumber: input.tableNumber,
        dishName,
        productId: item.productId,
        estimatedMinutes,
        notes: item.notes,
        position: position++,
        columnEnteredAt,
        createdById: context.session.userId,
      };
    });

    const result = await prisma.kitchenOrder.createMany({ data });

    return { count: result.count };
  });
