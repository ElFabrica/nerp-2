import prisma from "@/lib/db";
import { z } from "zod";
import { base } from "@/app/middlewares/base";
import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { ProductUnit } from "@/generated/prisma/enums";
import { requireOrgMiddleware } from "@/app/middlewares/org";

export const updateProduct = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Criar um novo produto",
    tags: ["products"],
  })
  .input(
    z.object({
      // Informações básicas
      id: z.string(),
      name: z.string().min(1).optional(),
      categoryId: z.string().optional(),
      description: z.string().optional(),
      sku: z.string().optional(),
      barcode: z.string().optional(),
      unit: z.enum(ProductUnit).default(ProductUnit.UN).optional(),

      // Preços
      costPrice: z.number().min(0).optional(),
      salePrice: z.number().min(0).optional(),
      promotionalPrice: z.number().optional(),

      minStock: z.number().default(0),
      maxStock: z.number().optional(),
      location: z.string().optional(),

      // Imagens
      images: z.array(z.string()).default([]),
      thumbnail: z.string().optional(),

      // Dimensões e peso
      weight: z.number().optional(),
      length: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),

      // Controle
      isActive: z.boolean().default(true),
      isFeatured: z.boolean().default(false),
      trackStock: z.boolean().default(true),
      allowNegative: z.boolean().default(false),
    })
  )
  .output(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    })
  )
  .handler(async ({ input, errors }) => {
    const productExists = await prisma.product.findUnique({
      where: {
        id: input.id,
      },
    });

    if (!productExists) {
      throw errors.BAD_REQUEST({
        message: "Produto não encontrado!",
      });
    }

    // Criar o produto
    const product = await prisma.product.update({
      where: {
        id: input.id,
      },
      data: {
        name: input.name,
        categoryId: input.categoryId === "" ? null : input.categoryId,
        description: input.description,
        sku: input.sku,
        barcode: input.barcode,
        unit: input.unit,
        costPrice: input.costPrice,
        salePrice: input.salePrice,
        promotionalPrice: input.promotionalPrice,
        minStock: input.minStock,
        maxStock: input.maxStock,
        images: input.images,
        thumbnail: input.thumbnail || input.images[0] || "",
        weight: input.weight,
        length: input.length,
        width: input.width,
        height: input.height,
        isActive: input.isActive,
        isFeatured: input.isFeatured,
        trackStock: input.trackStock,
      },
    });

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
    };
  });
