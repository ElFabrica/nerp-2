import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import {
  MovementType,
  PaymentMethod,
  SaleStatus,
} from "@/generated/prisma/enums";
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
  .handler(async ({ context, input, errors }) => {
    // 1. Busca todos os produtos de uma vez
    const productIds = input.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        organizationId: context.org.id,
      },
    });

    // 2. Valida se todos os produtos existem
    if (products.length !== productIds.length) {
      throw errors.NOT_FOUND({
        message: "Um ou mais produtos não encontrados",
      });
    }

    // 3. Mapeia produtos por ID para acesso rápido
    const productMap = new Map(products.map((p) => [p.id, p]));

    // 4. Valida estoque de todos os itens antes de prosseguir
    for (const item of input.items) {
      const product = productMap.get(item.productId)!;

      if (!product.trackStock) continue;

      const newStock = product.currentStock.toNumber() - item.quantity;
      if (newStock < 0) {
        throw errors.BAD_REQUEST({
          message: `Estoque insuficiente para o produto "${product.name}"`,
        });
      }
    }

    // 5. Cria a venda com os itens dentro de uma transação
    const sale = await prisma.$transaction(async (tx) => {
      const saleNumber = await tx.sale.count({
        where: { organizationId: context.org.id },
      });

      const createdSale = await tx.sale.create({
        data: {
          organizationId: context.org.id,
          createdById: context.user.id,
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

      // 6. Registra saída de estoque e atualiza cada produto
      for (const item of input.items) {
        const product = productMap.get(item.productId)!;

        if (!product.trackStock) continue;

        const previousStock = product.currentStock.toNumber();
        const newStock = previousStock - item.quantity;

        await tx.stockMovement.create({
          data: {
            type: MovementType.VENDA,
            quantity: item.quantity,
            productId: product.id,
            organizationId: context.org.id,
            createdById: context.user.id,
            saleId: createdSale.id,
            previousStock,
            newStock,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: { currentStock: newStock },
        });
      }

      return createdSale;
    });

    return { saleNumber: sale.saleNumber };
  });
