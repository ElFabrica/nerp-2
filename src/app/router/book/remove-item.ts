import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import { z } from "zod";

export const removeBookItem = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({ bookId: z.string(), pdvPhotoId: z.string() }))
  .handler(async ({ input, context, errors }) => {
    const book = await prisma.book.findFirst({
      where: { id: input.bookId, organizationId: context.org.id },
      select: { id: true },
    });
    if (!book) {
      throw errors.NOT_FOUND({ message: "Book não encontrado" });
    }

    await prisma.bookItem.deleteMany({
      where: { bookId: input.bookId, pdvPhotoId: input.pdvPhotoId },
    });

    return { success: true };
  });
