import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import { z } from "zod";

export const getBook = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context, errors }) => {
    const book = await prisma.book.findFirst({
      where: { id: input.id, organizationId: context.org.id },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          orderBy: { order: "asc" },
          include: {
            pdvPhoto: {
              select: {
                id: true,
                photos: true,
                section: true,
                code: true,
                actionValue: true,
                coordinatorName: true,
                consultantName: true,
                responsibleCompany: true,
                capturedAt: true,
                store: { select: { name: true, managerName: true } },
              },
            },
          },
        },
      },
    });

    if (!book) {
      throw errors.NOT_FOUND({ message: "Book não encontrado" });
    }

    return {
      id: book.id,
      name: book.name,
      supplierId: book.supplierId,
      supplierName: book.supplier?.name ?? null,
      periodMonth: book.periodMonth,
      periodYear: book.periodYear,
      status: book.status,
      pdfKey: book.pdfKey,
      generatedAt: book.generatedAt?.toISOString() ?? null,
      items: book.items.map((item) => ({
        pdvPhotoId: item.pdvPhotoId,
        order: item.order,
        storeName: item.pdvPhoto.store.name,
        storeManager: item.pdvPhoto.store.managerName,
        section: item.pdvPhoto.section,
        code: item.pdvPhoto.code,
        actionValue: item.pdvPhoto.actionValue
          ? Number(item.pdvPhoto.actionValue)
          : null,
        coordinatorName: item.pdvPhoto.coordinatorName,
        consultantName: item.pdvPhoto.consultantName,
        responsibleCompany: item.pdvPhoto.responsibleCompany,
        capturedAt: item.pdvPhoto.capturedAt.toISOString(),
        photos: item.pdvPhoto.photos,
      })),
    };
  });
