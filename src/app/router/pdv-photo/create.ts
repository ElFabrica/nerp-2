import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import { z } from "zod";

export const createPdvPhoto = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      storeId: z.string(),
      mapObjectId: z.string().optional(),
      supplierId: z.string().optional(),
      section: z.string().optional(),
      responsibleCompany: z.string().optional(),
      coordinatorName: z.string().optional(),
      consultantName: z.string().optional(),
      code: z.string().optional(),
      photos: z.array(z.string()).default([]),
      capturedAt: z.string().optional(),
      notes: z.string().optional(),
    }),
  )
  .output(z.object({ id: z.string() }))
  .handler(async ({ input, context, errors }) => {
    const store = await prisma.store.findFirst({
      where: { id: input.storeId, organizationId: context.org.id },
      select: { id: true },
    });
    if (!store) {
      throw errors.NOT_FOUND({ message: "Loja não encontrada" });
    }

    const photo = await prisma.pdvPhoto.create({
      data: {
        organizationId: context.org.id,
        storeId: input.storeId,
        mapObjectId: input.mapObjectId,
        supplierId: input.supplierId,
        section: input.section,
        responsibleCompany: input.responsibleCompany,
        coordinatorName: input.coordinatorName,
        consultantName: input.consultantName,
        code: input.code,
        photos: input.photos,
        capturedAt: input.capturedAt ? new Date(input.capturedAt) : undefined,
        notes: input.notes,
        createdById: context.user.id,
      },
      select: { id: true },
    });

    return { id: photo.id };
  });
