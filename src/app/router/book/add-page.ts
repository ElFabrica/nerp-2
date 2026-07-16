import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import { z } from "zod";

// Cria uma página em branco (PdvPhoto vazio) e já vincula ao book — o
// vendedor preenche os campos e sobe as fotos direto na página, sem
// precisar de um fluxo separado de "importar fotos" pré-existentes.
export const addBookPage = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({ bookId: z.string(), storeId: z.string() }))
  .output(z.object({ pdvPhotoId: z.string() }))
  .handler(async ({ input, context, errors }) => {
    const book = await prisma.book.findFirst({
      where: { id: input.bookId, organizationId: context.org.id },
      select: { id: true },
    });
    if (!book) {
      throw errors.NOT_FOUND({ message: "Book não encontrado" });
    }

    const store = await prisma.store.findFirst({
      where: { id: input.storeId, organizationId: context.org.id },
      select: { id: true },
    });
    if (!store) {
      throw errors.NOT_FOUND({ message: "Loja não encontrada" });
    }

    const pdvPhotoId = await prisma.$transaction(async (tx) => {
      const photo = await tx.pdvPhoto.create({
        data: {
          organizationId: context.org.id,
          storeId: input.storeId,
          photos: [],
          createdById: context.user.id,
        },
        select: { id: true },
      });

      const last = await tx.bookItem.findFirst({
        where: { bookId: input.bookId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      await tx.bookItem.create({
        data: {
          bookId: input.bookId,
          pdvPhotoId: photo.id,
          order: (last?.order ?? -1) + 1,
        },
      });

      return photo.id;
    });

    return { pdvPhotoId };
  });
