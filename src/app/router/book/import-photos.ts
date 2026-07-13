import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import { z } from "zod";

export const importBookPhotos = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      bookId: z.string(),
      pdvPhotoIds: z.array(z.string()),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const book = await prisma.book.findFirst({
      where: { id: input.bookId, organizationId: context.org.id },
      select: { id: true },
    });
    if (!book) {
      throw errors.NOT_FOUND({ message: "Book não encontrado" });
    }

    // Só aceita fotos da própria organização.
    const validPhotos = await prisma.pdvPhoto.findMany({
      where: {
        id: { in: input.pdvPhotoIds },
        organizationId: context.org.id,
      },
      select: { id: true },
    });

    const last = await prisma.bookItem.findFirst({
      where: { bookId: input.bookId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const baseOrder = (last?.order ?? -1) + 1;

    await prisma.bookItem.createMany({
      data: validPhotos.map((photo, index) => ({
        bookId: input.bookId,
        pdvPhotoId: photo.id,
        order: baseOrder + index,
      })),
      skipDuplicates: true,
    });

    return { added: validPhotos.length };
  });
