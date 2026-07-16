import "server-only";

import prisma from "@/lib/db";
import {
  DEFAULT_MEDIA_TYPES,
  DEFAULT_NEGOTIATION_TYPES,
  DEFAULT_STORE_SECTORS,
} from "./defaults";

type PrismaLike = typeof prisma;

// Semeia os catálogos padrão do Trade numa org. Idempotente: o
// `@@unique([organizationId, code])` + `skipDuplicates` fazem re-execuções serem
// no-op, então serve tanto ao hook de criação quanto ao backfill.
export async function ensureTradeCatalogs(
  organizationId: string,
  client: PrismaLike = prisma,
): Promise<void> {
  await client.mediaType.createMany({
    data: DEFAULT_MEDIA_TYPES.map((media, index) => ({
      organizationId,
      kind: media.kind,
      code: media.code,
      name: media.name,
      sortOrder: index,
      isSystemDefault: true,
    })),
    skipDuplicates: true,
  });

  await client.negotiationType.createMany({
    data: DEFAULT_NEGOTIATION_TYPES.map((negotiation, index) => ({
      organizationId,
      code: negotiation.code,
      name: negotiation.name,
      sortOrder: index,
      isSystemDefault: true,
    })),
    skipDuplicates: true,
  });

  await client.storeSector.createMany({
    data: DEFAULT_STORE_SECTORS.map((sector, index) => ({
      organizationId,
      code: sector.code,
      name: sector.name,
      sortOrder: index,
      isSystemDefault: true,
    })),
    skipDuplicates: true,
  });
}
