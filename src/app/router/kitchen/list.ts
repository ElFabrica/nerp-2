import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { KitchenOrderStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/db";
import { AUTO_HIDE_MS } from "@/utils/kitchen-config";
import type { Prisma } from "@/generated/prisma/client";
import z from "zod";

type KitchenOrderListItem = {
  id: string;
  tableNumber: string;
  dishName: string;
  status: KitchenOrderStatus;
  estimatedMinutes: number | null;
  createdAt: string;
  readyAt: string | null;
  deliveredAt: string | null;
};

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
      status: z.enum(KitchenOrderStatus).optional(),
    }),
  )
  .handler(async ({ context, input }): Promise<KitchenOrderListItem[]> => {
    const where: Prisma.KitchenOrderWhereInput = {
      organizationId: context.org.id,
    };
    let orderBy: Prisma.KitchenOrderOrderByWithRelationInput = {
      createdAt: "asc",
    };

    if (input.status) {
      where.status = input.status;

      if (input.status === "EM_PREPARO") {
        // mais antigo/atrasado no topo
        orderBy = { createdAt: "asc" };
      } else if (input.status === "PRONTO") {
        orderBy = { readyAt: "desc" };
      } else if (input.status === "ENTREGUE") {
        // janela de entregues recentes — evita lista infinita
        where.deliveredAt = { gte: new Date(Date.now() - AUTO_HIDE_MS) };
        orderBy = { deliveredAt: "desc" };
      }
    }

    const orders = await prisma.kitchenOrder.findMany({ where, orderBy });

    return orders.map((order) => ({
      id: order.id,
      tableNumber: order.tableNumber,
      dishName: order.dishName,
      status: order.status,
      estimatedMinutes: order.estimatedMinutes,
      createdAt: order.createdAt.toISOString(),
      readyAt: order.readyAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
    }));
  });
