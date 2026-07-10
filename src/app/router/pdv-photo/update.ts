import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import { z } from "zod";

export const updatePdvPhoto = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      id: z.string(),
      supplierId: z.string().nullable().optional(),
      section: z.string().nullable().optional(),
      responsibleCompany: z.string().nullable().optional(),
      coordinatorName: z.string().nullable().optional(),
      consultantName: z.string().nullable().optional(),
      code: z.string().nullable().optional(),
      photos: z.array(z.string()).optional(),
      capturedAt: z.string().optional(),
      notes: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const { id, capturedAt, ...rest } = input;

    const photo = await prisma.pdvPhoto.findFirst({
      where: { id, organizationId: context.org.id },
      select: { id: true },
    });
    if (!photo) {
      throw errors.NOT_FOUND({ message: "Foto do PDV não encontrada" });
    }

    return prisma.pdvPhoto.update({
      where: { id },
      data: {
        ...rest,
        capturedAt: capturedAt ? new Date(capturedAt) : undefined,
      },
      select: { id: true },
    });
  });
