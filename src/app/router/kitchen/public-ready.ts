import { base } from "@/app/middlewares/base";
import prisma from "@/lib/db";
import { AUTO_HIDE_MS } from "@/utils/kitchen-config";
import z from "zod";

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
  .output(
    z.object({
      orgName: z.string(),
      orders: z.array(
        z.object({
          id: z.string(),
          tableNumber: z.string(),
          dishName: z.string(),
          readyAt: z.string(),
        }),
      ),
    }),
  )
  .handler(async ({ input, errors }) => {
    const org = await prisma.organization.findUnique({
      where: { slug: input.orgSlug },
    });

    if (!org) {
      throw errors.NOT_FOUND({ message: "Organização não encontrada!" });
    }

    const orders = await prisma.kitchenOrder.findMany({
      where: {
        organizationId: org.id,
        column: { showOnTv: true },
        columnEnteredAt: { gte: new Date(Date.now() - AUTO_HIDE_MS) },
      },
      orderBy: { columnEnteredAt: "desc" },
    });

    return {
      orgName: org.name,
      orders: orders.map((order) => ({
        id: order.id,
        tableNumber: order.tableNumber,
        dishName: order.dishName,
        readyAt: order.columnEnteredAt.toISOString(),
      })),
    };
  });
