import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { Prisma } from "@/generated/prisma/client";
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
      actionValue: z.number().nonnegative().nullable().optional(),
      photos: z.array(z.string()).optional(),
      photoLayout: z
        .enum(["PATTERN_1", "PATTERN_2", "PATTERN_3", "PATTERN_4"])
        .nullable()
        .optional(),
      photoAdjustments: z
        .record(
          z.string(),
          z.object({
            zoom: z.number().min(1).max(3),
            posX: z.number().min(0).max(100),
            posY: z.number().min(0).max(100),
          }),
        )
        .nullable()
        .optional(),
      capturedAt: z.string().optional(),
      notes: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const { id, capturedAt, photoAdjustments, ...rest } = input;

    const photo = await prisma.pdvPhoto.findFirst({
      where: { id, organizationId: context.org.id },
      select: { id: true },
    });
    if (!photo) {
      throw errors.NOT_FOUND({ message: "Foto do PDV não encontrada" });
    }

    const data: Prisma.PdvPhotoUncheckedUpdateInput = {
      ...rest,
      capturedAt: capturedAt ? new Date(capturedAt) : undefined,
      photoAdjustments:
        photoAdjustments === undefined
          ? undefined
          : (photoAdjustments ?? Prisma.JsonNull),
    };

    return prisma.pdvPhoto.update({
      where: { id },
      data,
      select: { id: true },
    });
  });
