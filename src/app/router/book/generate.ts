import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import { bookGenerateRequested, inngest } from "@/lib/inngest/client";
import { z } from "zod";

export const generateBookPdf = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context, errors }) => {
    const book = await prisma.book.findFirst({
      where: { id: input.id, organizationId: context.org.id },
      select: { id: true, _count: { select: { items: true } } },
    });
    if (!book) {
      throw errors.NOT_FOUND({ message: "Book não encontrado" });
    }
    if (book._count.items === 0) {
      throw errors.BAD_REQUEST({
        message: "Adicione ao menos uma foto antes de gerar o book.",
      });
    }

    await prisma.book.update({
      where: { id: input.id },
      data: { status: "GENERATING" },
    });

    await inngest.send(bookGenerateRequested.create({ bookId: input.id }));

    return { status: "GENERATING" as const };
  });
