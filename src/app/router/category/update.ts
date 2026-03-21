import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import prisma from "@/lib/db";
import { z } from "zod";

export const updateCategory = base
  .use(requireAuthMiddleware)
  .route({
    method: "PUT",
    path: "/category/:id",
    summary: "Atualizar categoria",
    tags: ["categories"],
  })
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      parentId: z.string().optional(),
    })
  )
  .output(
    z.object({
      categoryName: z.string(),
    })
  )
  .handler(async ({ errors, input }) => {
    const categoryExists = await prisma.category.findUnique({
      where: {
        id: input.id,
      },
    });

    if (!categoryExists) {
      throw errors.NOT_FOUND({
        message: "Categoria não encontrada.",
      });
    }

    const category = await prisma.category.update({
      where: {
        id: input.id,
      },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        parentId: input.parentId,
      },
    });

    return {
      categoryName: category.name,
    };
  });
