import prisma from "@/lib/db";
import { z } from "zod";
import { base } from "@/app/middlewares/base";
import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { ProductUnit } from "@/generated/prisma/enums";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { orpc } from "@/lib/orpc";

export const createProduct = base
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
      name: z.string().min(1),
      categoryId: z.string().optional(),
      description: z.string().optional(),
      sku: z.string().optional(),
      barcode: z.string().optional(),
      unit: z.enum(ProductUnit).default(ProductUnit.UN),

      // Preços
      costPrice: z.number().min(0),
      salePrice: z.number().min(0),
      promotionalPrice: z.number().optional(),

      // Estoque
      currentStock: z.number().default(0),
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
      showOnCatalog: z.boolean().default(true),
    })
  )
  // .output(
  //   z.object({
  //     id: z.string(),
  //     name: z.string(),
  //     slug: z.string(),
  //   })
  // )
  .handler(async ({ input, context, errors }) => {
    try {
      // Gerar slug a partir do nome
      const slug = input.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-")
        .trim();

      // Verificar se o slug já existe
      const existingProduct = await prisma.product.findUnique({
        where: {
          organizationId_slug: {
            organizationId: context.org.id,
            slug: slug,
          },
        },
      });

      let finalSlug = slug;
      if (existingProduct) {
        // Adicionar timestamp para tornar único
        finalSlug = `${slug}-${Date.now()}`;
      }

      // Verificar se o SKU já existe (se fornecido)
      if (input.sku) {
        const existingSku = await prisma.product.findFirst({
          where: {
            organizationId: context.org.id,
            sku: input.sku,
          },
        });

        if (existingSku) {
          throw errors.BAD_REQUEST({
            message: "SKU já existe para outro produto",
          });
        }
      }

      // Criar o produto
      const product = await prisma.product.create({
        data: {
          organizationId: context.org.id,
          createdById: context.user.id,
          name: input.name,
          slug: finalSlug,
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

      if (input.currentStock > 0) {
        orpc.stocks.create.entry.call({
          productId: product.id,
          quantity: input.currentStock,
          type: "ENTRADA",
          description: "Entrada de estoque",
        });
      }

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
      };
    } catch (error) {
      throw error;
    }
  });
