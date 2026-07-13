import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import { z } from "zod";

export const updateStore = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      id: z.string(),
      name: z.string().min(2).optional(),
      code: z.string().optional(),
      managerName: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const { id, ...data } = input;

    const store = await prisma.store.findFirst({
      where: { id, organizationId: context.org.id },
      select: { id: true },
    });

    if (!store) {
      throw errors.NOT_FOUND({ message: "Loja não encontrada" });
    }

    return prisma.store.update({ where: { id }, data });
  });
