import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { PersonType } from "@/generated/prisma/client";
import prisma from "@/lib/db";
import z from "zod";

export const listSupplier = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      personType: z.enum(PersonType).optional(),
    }),
  )
  .output(
    z.object({
      suppliers: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          tradeName: z.string().nullable(),
          document: z.string().nullable(),
          personType: z.enum(PersonType),
          phone: z.string().nullable(),
          email: z.string().nullable(),
          contactPerson: z.string().nullable(),
          city: z.string().nullable(),
          state: z.string().nullable(),
          isActive: z.boolean(),
          logo: z.string().nullable(),
        }),
      ),
    }),
  )
  .handler(async ({ context, input }) => {
    const suppliers = await prisma.supplier.findMany({
      where: {
        organizationId: context.org.id,
        personType: {
          equals: input.personType,
        },
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        tradeName: true,
        document: true,
        personType: true,
        phone: true,
        email: true,
        contactPerson: true,
        city: true,
        state: true,
        isActive: true,
        logo: true,
      },
    });

    return {
      suppliers,
    };
  });
