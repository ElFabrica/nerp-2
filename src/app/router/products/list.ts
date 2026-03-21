import prisma from "@/lib/db";
import { z } from "zod";
import { base } from "@/app/middlewares/base";
import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { requireOrgMiddleware } from "@/app/middlewares/org";

export const listProducts = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "GET",
    summary: "Listar todos os produtos",
    tags: ["products"],
  })
  .input(
    z.object({
      category: z.array(z.string()).optional(),
      sku: z.string().optional(),
      minValue: z.string().optional(),
      maxValue: z.string().optional(),
      dateInit: z.date().optional(),
      dateEnd: z.date().optional(),
      page: z.number(),
      pageSize: z.number(),
    }),
  )
  .output(
    z.object({
      products: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          sku: z.string(),
          barcode: z.string(),
          category: z.string(),
          salePrice: z.number(),
          costPrice: z.number(),
          currentStock: z.number(),
          minStock: z.number(),
          maxStock: z.number().optional(),

          image: z.string(),
          isActive: z.boolean(),
        }),
      ),
      page: z.number(),
      pageSize: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { page, pageSize } = input;

    try {
      const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            category: {
              select: {
                name: true,
              },
            },
            salePrice: true,
            costPrice: true,
            currentStock: true,
            minStock: true,
            maxStock: true,
            images: true,
            isActive: true,
            thumbnail: true,
          },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,

          where: {
            organizationId: context.org.id,
            ...(input.category && {
              category: {
                slug: {
                  in: input.category,
                },
              },
            }),
            ...(input.sku && {
              sku: {
                contains: input.sku,
              },
            }),
            ...(input.minValue && {
              salePrice: {
                gte: Number(input.minValue) / 100,
              },
            }),
            ...(input.maxValue && {
              salePrice: {
                lte: Number(input.maxValue) / 100,
              },
            }),
            ...(input.dateInit &&
              input.dateEnd && {
                createdAt: {
                  gte: input.dateInit,
                  lte: input.dateEnd,
                },
              }),
          },
        }),
        prisma.product.count({
          where: {
            organizationId: context.org.id,
            ...(input.category && {
              category: {
                slug: {
                  in: input.category,
                },
              },
            }),
            ...(input.sku && {
              sku: {
                contains: input.sku,
              },
            }),
            ...(input.minValue && {
              salePrice: {
                gte: Number(input.minValue) / 100,
              },
            }),
            ...(input.maxValue && {
              salePrice: {
                lte: Number(input.maxValue) / 100,
              },
            }),
            ...(input.dateInit &&
              input.dateEnd && {
                createdAt: {
                  gte: input.dateInit,
                  lte: input.dateEnd,
                },
              }),
          },
        }),
      ]);

      const productList = products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku ?? "",
        barcode: product.barcode ?? "",
        category: product.category?.name ?? "",
        salePrice: product.salePrice.toNumber(),
        costPrice: product.costPrice.toNumber(),
        currentStock: product.currentStock.toNumber(),
        minStock: product.minStock.toNumber(),
        maxStock: product.maxStock?.toNumber(),
        image: product.thumbnail ?? "",
        isActive: product.isActive,
      }));

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        products: productList,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    } catch (error) {
      throw error;
    }
  });
