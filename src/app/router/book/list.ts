import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import { z } from "zod";

export const listBook = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(z.object({}))
  .handler(async ({ context }) => {
    const books = await prisma.book.findMany({
      where: { organizationId: context.org.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        periodMonth: true,
        periodYear: true,
        status: true,
        pdfKey: true,
        generatedAt: true,
        supplier: { select: { name: true } },
        _count: { select: { items: true } },
      },
    });

    return {
      books: books.map((book) => ({
        id: book.id,
        name: book.name,
        periodMonth: book.periodMonth,
        periodYear: book.periodYear,
        status: book.status,
        pdfKey: book.pdfKey,
        generatedAt: book.generatedAt?.toISOString() ?? null,
        supplierName: book.supplier.name,
        itemsCount: book._count.items,
      })),
    };
  });
