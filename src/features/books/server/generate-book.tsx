import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import { v4 as uuidv4 } from "uuid";
import { constructUrl } from "@/hooks/use-construct-url";
import prisma from "@/lib/db";
import { uploadBufferToR2 } from "@/lib/upload-buffer-to-r2";
import { BookDocument, type BookDocumentData } from "../pdf/book-document";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export async function generateBook(bookId: string): Promise<string> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      organization: { select: { logo: true, name: true } },
      supplier: {
        select: {
          name: true,
          logo: true,
          brands: { where: { isActive: true }, select: { logo: true } },
        },
      },
      items: {
        orderBy: { order: "asc" },
        include: {
          pdvPhoto: {
            include: {
              store: { select: { name: true, managerName: true } },
              supplier: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!book) throw new Error("Book não encontrado");

  const distributorKey = book.distributorLogo ?? book.organization.logo;

  const data: BookDocumentData = {
    bookName: book.name,
    periodLabel: `${MONTHS[book.periodMonth - 1] ?? ""} / ${book.periodYear}`,
    distributorLogoUrl: distributorKey ? constructUrl(distributorKey) : null,
    industryLogoUrl: book.supplier.logo
      ? constructUrl(book.supplier.logo)
      : null,
    industryName: book.supplier.name,
    brandLogoUrls: book.supplier.brands
      .map((brand) => brand.logo)
      .filter((logo): logo is string => !!logo)
      .map(constructUrl),
    items: book.items.map((item) => ({
      storeName: item.pdvPhoto.store.name,
      storeManager: item.pdvPhoto.store.managerName,
      section: item.pdvPhoto.section,
      responsibleCompany: item.pdvPhoto.responsibleCompany,
      coordinatorName: item.pdvPhoto.coordinatorName,
      consultantName: item.pdvPhoto.consultantName,
      code: item.pdvPhoto.code,
      supplierName: item.pdvPhoto.supplier?.name ?? null,
      photoUrls: item.pdvPhoto.photos.map(constructUrl),
    })),
  };

  const buffer = await renderToBuffer(<BookDocument data={data} />);
  const key = `books/${bookId}-${uuidv4()}.pdf`;
  await uploadBufferToR2(key, Buffer.from(buffer), "application/pdf");

  await prisma.book.update({
    where: { id: bookId },
    data: { pdfKey: key, status: "READY", generatedAt: new Date() },
  });

  return key;
}
