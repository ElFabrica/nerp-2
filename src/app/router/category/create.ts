import { z } from "zod";
import prisma from "@/lib/db";
import { base } from "@/app/middlewares/base";
import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { requireOrgMiddleware } from "@/app/middlewares/org";

export const createCategory = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Criar categoria",
    tags: ["categories"],
  })
  .input(
    z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      parentId: z.string().optional(),
    })
  )
  .output(
    z.object({
      categoryName: z.string(),
    })
  )
  .handler(async ({ input, context, errors }) => {
    const categoryExists = await prisma.category.findFirst({
      where: {
        slug: input.slug,
      },
    });

    if (categoryExists) {
      throw errors.BAD_REQUEST({
        message: "Categoria com este slug já existe",
      });
    }

    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        organizationId: context.org.id,
        parentId: input.parentId,
      },
    });

    return {
      categoryName: category.name,
    };
  });
