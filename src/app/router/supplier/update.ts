import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { Supplier } from "@/generated/prisma/client";
import prisma from "@/lib/db";
import { z } from "zod";

export const updateSupplier = base
  .use(requireAuthMiddleware)
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      tradeName: z.string().optional(),
      personType: z.enum(["FISICA", "JURIDICA"]).optional(),
      document: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      contactPerson: z.string().optional(),
      logo: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
    })
  )
  .output(
    z.object({
      supplier: z.custom<Supplier>(),
    })
  )
  .handler(async ({ input, errors }) => {
    const supplier = await prisma.supplier.findUnique({
      where: { id: input.id },
    });

    if (!supplier) {
      throw errors.NOT_FOUND({
        message: "Fornecedor não encontrado",
      });
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id: input.id },
      data: {
        name: input.name,
        tradeName: input.tradeName,
        personType: input.personType,
        document: input.document,
        phone: input.phone,
        email: input.email,
        contactPerson: input.contactPerson,
        logo: input.logo,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        address: input.address,
        notes: input.notes,
      },
    });

    return { supplier: updatedSupplier };
  });
