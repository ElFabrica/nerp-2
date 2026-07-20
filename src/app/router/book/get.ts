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
        supplier: {
          select: { id: true, name: true, logo: true },
        },
        organization: { select: { name: true, tradeName: true } },
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
                photoLayout: true,
                photoAdjustments: true,
                capturedAt: true,
                mediaTypeId: true,
                managerName: true,
                store: { select: { name: true, managerName: true } },
                mediaType: { select: { name: true } },
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
      supplierLogo: book.supplier?.logo ?? null,
      organizationName: book.organization.tradeName ?? book.organization.name,
      distributorLogo: book.distributorLogo,
      periodMonth: book.periodMonth,
      periodYear: book.periodYear,
      status: book.status,
      pdfKey: book.pdfKey,
      coverLayout: book.coverLayout,
      closingLayout: book.closingLayout,
      coverBackground: book.coverBackground,
      closingBackground: book.closingBackground,
      generatedAt: book.generatedAt?.toISOString() ?? null,
      items: book.items.map((item) => ({
        pdvPhotoId: item.pdvPhotoId,
        order: item.order,
        storeName: item.pdvPhoto.store.name,
        // Snapshot da página vence; vazio cai no gerente cadastrado na loja.
        managerName:
          item.pdvPhoto.managerName ?? item.pdvPhoto.store.managerName,
        mediaTypeId: item.pdvPhoto.mediaTypeId,
        mediaTypeName: item.pdvPhoto.mediaType?.name ?? null,
        section: item.pdvPhoto.section,
        code: item.pdvPhoto.code,
        actionValue: item.pdvPhoto.actionValue
          ? Number(item.pdvPhoto.actionValue)
          : null,
        coordinatorName: item.pdvPhoto.coordinatorName,
        consultantName: item.pdvPhoto.consultantName,
        photoLayout: item.pdvPhoto.photoLayout,
        photoAdjustments: item.pdvPhoto.photoAdjustments as Record<
          string,
          { zoom: number; posX: number; posY: number }
        > | null,
        capturedAt: item.pdvPhoto.capturedAt.toISOString(),
        photos: item.pdvPhoto.photos,
      })),
    };
  });
