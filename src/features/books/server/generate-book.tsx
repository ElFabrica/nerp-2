import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import { v4 as uuidv4 } from "uuid";
import { constructUrl } from "@/hooks/use-construct-url";
import prisma from "@/lib/db";
import { uploadBufferToR2 } from "@/lib/upload-buffer-to-r2";
import type { CoverBackground, CoverElement } from "../lib/cover-layout";
import {
  DEFAULT_PHOTO_ADJUSTMENT,
  getSlotAspectRatio,
  type PhotoAdjustment,
} from "../lib/photo-adjustment";
import {
  BookDocument,
  type BookDocumentData,
  type PhotoSource,
} from "../pdf/book-document";
import { cropPhotoForPdf } from "./crop-photo";

// `imageKey` de cada elemento tipo "image" vira URL completa — book-document.tsx
// só sabe renderizar, não resolve keys do R2.
function resolveLayoutImages(layout: unknown): CoverElement[] | null {
  if (!Array.isArray(layout)) return null;
  return (layout as CoverElement[]).map((element) =>
    element.type === "image" && element.imageKey
      ? { ...element, imageKey: constructUrl(element.imageKey) }
      : element,
  );
}

// `imageKey` do fundo vira URL completa, igual resolveLayoutImages faz pros
// elementos — book-document.tsx só sabe renderizar, não resolve keys do R2.
function readBackground(value: unknown): CoverBackground | null {
  if (!value || typeof value !== "object") return null;
  const background = value as CoverBackground;
  return {
    ...background,
    imageKey: background.imageKey ? constructUrl(background.imageKey) : null,
  };
}

type PhotoAdjustmentMap = Record<string, PhotoAdjustment>;

function readPhotoAdjustments(value: unknown): PhotoAdjustmentMap {
  if (!value || typeof value !== "object") return {};
  return value as PhotoAdjustmentMap;
}

// Foto sem ajuste salvo = URL direta (react-pdf baixa e faz "cover"
// sozinho, igual sempre foi). Com ajuste, corta com sharp reproduzindo o
// mesmo pan/zoom calculado no editor antes de embutir no PDF.
async function resolvePhotoSources(
  photos: string[],
  adjustments: PhotoAdjustmentMap,
  pattern: "PATTERN_1" | "PATTERN_2" | "PATTERN_3" | "PATTERN_4" | null,
): Promise<PhotoSource[]> {
  return Promise.all(
    photos.map(async (key, index) => {
      const adjustment = adjustments[key];
      if (!adjustment) return constructUrl(key);
      const aspectRatio = getSlotAspectRatio(pattern, index, photos.length);
      try {
        const buffer = await cropPhotoForPdf(
          constructUrl(key),
          adjustment ?? DEFAULT_PHOTO_ADJUSTMENT,
          aspectRatio,
        );
        return { data: buffer, format: "jpg" as const };
      } catch {
        // Se o corte falhar por qualquer motivo (ex.: imagem inacessível),
        // cai pra URL original em vez de quebrar a geração do PDF inteiro.
        return constructUrl(key);
      }
    }),
  );
}

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

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

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
              mediaType: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!book) throw new Error("Book não encontrado");

  const distributorKey = book.distributorLogo ?? book.organization.logo;

  const items = await Promise.all(
    book.items.map(async (item) => ({
      storeName: item.pdvPhoto.store.name,
      // Mesmo fallback do book.getOne — o que o card mostra é o que sai no PDF.
      storeManager:
        item.pdvPhoto.managerName ?? item.pdvPhoto.store.managerName,
      coordinatorName: item.pdvPhoto.coordinatorName,
      consultantName: item.pdvPhoto.consultantName,
      responsibleCompany: item.pdvPhoto.responsibleCompany,
      mediaTypeName: item.pdvPhoto.mediaType?.name ?? null,
      section: item.pdvPhoto.section,
      code: item.pdvPhoto.code,
      actionValueLabel: item.pdvPhoto.actionValue
        ? currency.format(Number(item.pdvPhoto.actionValue))
        : null,
      photoSources: await resolvePhotoSources(
        item.pdvPhoto.photos,
        readPhotoAdjustments(item.pdvPhoto.photoAdjustments),
        item.pdvPhoto.photoLayout,
      ),
      photoLayoutPattern: item.pdvPhoto.photoLayout,
    })),
  );

  const data: BookDocumentData = {
    bookName: book.name,
    periodLabel: `${MONTHS[book.periodMonth - 1] ?? ""} / ${book.periodYear}`,
    distributorLogoUrl: distributorKey ? constructUrl(distributorKey) : null,
    industryLogoUrl: book.supplier?.logo
      ? constructUrl(book.supplier.logo)
      : null,
    industryName: book.supplier?.name ?? null,
    brandLogoUrls: (book.supplier?.brands ?? [])
      .map((brand) => brand.logo)
      .filter((logo): logo is string => !!logo)
      .map(constructUrl),
    items,
    coverLayout: resolveLayoutImages(book.coverLayout),
    closingLayout: resolveLayoutImages(book.closingLayout),
    coverBackground: readBackground(book.coverBackground),
    closingBackground: readBackground(book.closingBackground),
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
