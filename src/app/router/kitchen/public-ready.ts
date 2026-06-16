import { base } from "@/app/middlewares/base";
import prisma from "@/lib/db";
import { AUTO_HIDE_MS } from "@/utils/kitchen-config";
import z from "zod";

type PublicReadyOrders = {
  orgName: string;
  orders: Array<{
    id: string;
    tableNumber: string;
    dishName: string;
    readyAt: string;
  }>;
};

export const publicReadyOrders = base
  .route({
    method: "GET",
    summary: "Pedidos prontos (painel TV, público)",
    tags: ["kitchen"],
  })
  .input(
    z.object({
      orgSlug: z.string().min(1),
    }),
  )
  .handler(async ({ input, errors }): Promise<PublicReadyOrders> => {
    const org = await prisma.organization.findUnique({
      where: { slug: input.orgSlug },
    });

    if (!org) {
      throw errors.NOT_FOUND({
        message: "Organização não encontrada!",
      });
    }

    const orders = await prisma.kitchenOrder.findMany({
      where: {
        organizationId: org.id,
        status: "PRONTO",
        readyAt: { gte: new Date(Date.now() - AUTO_HIDE_MS) },
      },
      orderBy: { readyAt: "desc" },
    });

    return {
      orgName: org.name,
      orders: orders.flatMap((order) => {
        if (!order.readyAt) return [];
        return [
          {
            id: order.id,
            tableNumber: order.tableNumber,
            dishName: order.dishName,
            readyAt: order.readyAt.toISOString(),
          },
        ];
      }),
    };
  });
