import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db";
import { AUTO_HIDE_MS } from "@/utils/kitchen-config";
import z from "zod";

export const listKitchenOrders = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "GET",
    summary: "Listar pedidos da cozinha",
    tags: ["kitchen"],
  })
  .input(
    z.object({
      columnId: z.string().optional(),
      recentOnly: z.boolean().optional(),
    }),
  )
  .output(
    z.array(
      z.object({
        id: z.string(),
        columnId: z.string(),
        tableNumber: z.string(),
        dishName: z.string(),
        estimatedMinutes: z.number().nullable(),
        position: z.number(),
        createdAt: z.string(),
        columnEnteredAt: z.string(),
      }),
    ),
  )
  .handler(async ({ context, input }) => {
    const recentWindow = new Date(Date.now() - AUTO_HIDE_MS);

    const where: Prisma.KitchenOrderWhereInput = {
      organizationId: context.org.id,
      ...(input.columnId ? { columnId: input.columnId } : {}),
    };

    if (input.recentOnly) {
      // Limita tudo à janela de recentes.
      where.columnEnteredAt = { gte: recentWindow };
    } else {
      // Colunas terminais (isFinal) só mostram cards recentes; demais sem limite.
      where.OR = [
        { column: { isFinal: false } },
        { columnEnteredAt: { gte: recentWindow } },
      ];
    }

    const orders = await prisma.kitchenOrder.findMany({
      where,
      orderBy: [{ column: { position: "asc" } }, { position: "asc" }],
    });

    return orders.map((order) => ({
      id: order.id,
      columnId: order.columnId,
      tableNumber: order.tableNumber,
      dishName: order.dishName,
      estimatedMinutes: order.estimatedMinutes,
      position: order.position,
      createdAt: order.createdAt.toISOString(),
      columnEnteredAt: order.columnEnteredAt.toISOString(),
    }));
  });
