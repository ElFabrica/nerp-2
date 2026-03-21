import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { PaymentMethod, SaleStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/db";
import z from "zod";

export const createSale = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Criar uma venda",
    tags: ["sales"],
  })
  .input(
    z.object({
      customerId: z.string().optional(),
      subtotal: z.number(),
      discount: z.number(),
      total: z.number(),
      status: z.enum(SaleStatus),
      paymentMethod: z.enum(PaymentMethod),
      items: z.array(
        z.object({
          productId: z.string(),
          productName: z.string(),
          unitPrice: z.number(),
          quantity: z.number(),
        }),
      ),
    }),
  )
  .output(
    z.object({
      saleNumber: z.number(),
    }),
  )
  .handler(async ({ context, input }) => {
    try {
      const saleNumber = await prisma.sale.count({
        where: {
          organizationId: context.session.activeOrganizationId!,
        },
      });

      const sale = await prisma.sale.create({
        data: {
          organizationId: context.session.activeOrganizationId!,
          customerId: input.customerId,
          paymentMethod: input.paymentMethod,
          subtotal: input.subtotal,
          discount: input.discount,
          total: input.total,
          saleNumber: saleNumber + 1,
          status: input.status,
          items: {
            createMany: {
              data: input.items.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.unitPrice * item.quantity,
              })),
            },
          },
        },
      });
      return { saleNumber: sale.saleNumber };
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
