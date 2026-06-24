import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import z from "zod";

export const getSupplier = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ input, errors }) => {
    const supplier = await prisma.supplier.findUnique({
      where: {
        id: input.id,
      },
      select: {
        id: true,
        name: true,
        tradeName: true,
        personType: true,
        document: true,
        email: true,
        phone: true,
        contactPerson: true,
        logo: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        notes: true,
      },
    });

    if (!supplier) {
      throw errors.NOT_FOUND({
        message: "Fornecedor não encontrado",
      });
    }

    return {
      supplier,
    };
  });
