// Sem `server-only`: além do handler oRPC, scripts de seed/manutenção rodam
// esta função no Node puro, onde esse guard do bundler não resolve.
import type { CatalogRow } from "@/features/pdv-catalog/lib/catalog-types";
import { SPACE_STATE_META } from "@/features/store-map/engine/space-state";
import type {
  Geometry,
  MapSpaceState,
} from "@/features/store-map/engine/types";
import {
  computeSuggestedPrice,
  DEFAULT_FLOW_MULTIPLIERS,
  DEFAULT_TIER_MULTIPLIERS,
  DEFAULT_VISIBILITY_MULTIPLIERS,
  resolveDisplayPrice,
} from "@/features/trade-catalog/lib/pricing";
import type { Prisma } from "@/generated/prisma/client";
import type {
  SpaceFlowLevel,
  SpaceTier,
  SpaceVisibility,
} from "@/generated/prisma/enums";
import prisma from "@/lib/db";

// O núcleo do catálogo: agrupa os espaços reais do mapa por (mídia, loja) e
// gera uma página por tipo de mídia, com uma linha por loja + quantidade.
// Vive fora do handler oRPC pra que scripts (seed/demo) exercitem exatamente
// o mesmo caminho que a aplicação — sem risco de a demo divergir do produto.
export async function generateTradeCatalogPagesFor(params: {
  catalogId: string;
  organizationId: string;
  mediaTypeIds: string[];
  onlyAvailable?: boolean;
}): Promise<string[]> {
  const { catalogId, organizationId, mediaTypeIds, onlyAvailable } = params;

  const mediaTypes = await prisma.mediaType.findMany({
    where: { id: { in: mediaTypeIds }, organizationId },
  });
  if (mediaTypes.length === 0) return [];

  const [settings, globalPhotos, existingPages, lastPage] = await Promise.all([
    prisma.tradePricingSettings.findUnique({ where: { organizationId } }),
    prisma.mediaModelPhoto.findMany({
      where: { code: { in: mediaTypes.map((mediaType) => mediaType.code) } },
      select: { code: true, imageKey: true },
    }),
    prisma.tradeCatalogPage.findMany({
      where: {
        catalogId,
        mediaTypeCode: { in: mediaTypes.map((mediaType) => mediaType.code) },
      },
      select: { id: true, mediaTypeCode: true },
    }),
    prisma.tradeCatalogPage.findFirst({
      where: { catalogId },
      orderBy: { order: "desc" },
      select: { order: true },
    }),
  ]);

  const pricingSettings = {
    markup: settings?.markup ?? 3,
    floorPrice: settings?.floorPrice ? Number(settings.floorPrice) : null,
    tierMultipliers:
      (settings?.tierMultipliers as Record<SpaceTier, number> | undefined) ??
      DEFAULT_TIER_MULTIPLIERS,
    flowMultipliers:
      (settings?.flowMultipliers as
        | Record<SpaceFlowLevel, number>
        | undefined) ?? DEFAULT_FLOW_MULTIPLIERS,
    visibilityMultipliers:
      (settings?.visibilityMultipliers as
        | Record<SpaceVisibility, number>
        | undefined) ?? DEFAULT_VISIBILITY_MULTIPLIERS,
  };

  const existingPageByCode = new Map(
    existingPages.map((page) => [page.mediaTypeCode, page.id]),
  );
  let nextOrder = (lastPage?.order ?? -1) + 1;
  const touchedPageIds: string[] = [];

  for (const mediaType of mediaTypes) {
    const objects = await prisma.mapObject.findMany({
      where: {
        organizationId,
        mediaTypeId: mediaType.id,
        spaceState: onlyAvailable ? "LIVRE" : undefined,
      },
      select: {
        geometry: true,
        tier: true,
        flowLevel: true,
        visibility: true,
        spaceState: true,
        floorPlan: {
          select: {
            store: {
              select: { id: true, name: true, areaM2: true, monthlyCost: true },
            },
          },
        },
      },
    });

    const manualPrices = await prisma.mediaTypePrice.findMany({
      where: { organizationId, mediaTypeId: mediaType.id },
      select: { storeId: true, price: true },
    });
    const manualByStoreId = new Map(
      manualPrices.map((price) => [price.storeId, Number(price.price)]),
    );

    const groups = new Map<
      string,
      {
        storeName: string;
        suggestedPrices: number[];
        states: MapSpaceState[];
        storeCost: { areaM2: number | null; monthlyCost: number | null };
      }
    >();

    for (const object of objects) {
      const store = object.floorPlan.store;
      const group = groups.get(store.id) ?? {
        storeName: store.name,
        suggestedPrices: [],
        states: [],
        storeCost: {
          areaM2: store.areaM2,
          monthlyCost: store.monthlyCost ? Number(store.monthlyCost) : null,
        },
      };

      const suggested = computeSuggestedPrice(
        group.storeCost,
        {
          pricingBasis: mediaType.pricingBasis,
          notionalAreaM2: mediaType.notionalAreaM2,
        },
        {
          tier: object.tier,
          flowLevel: object.flowLevel,
          visibility: object.visibility,
        },
        object.geometry as unknown as Geometry,
        pricingSettings,
      );
      if (suggested != null) group.suggestedPrices.push(suggested);
      group.states.push(object.spaceState);

      groups.set(store.id, group);
    }

    const rows: CatalogRow[] = [...groups.entries()].map(([storeId, group]) => {
      const averageSuggested =
        group.suggestedPrices.length > 0
          ? group.suggestedPrices.reduce((sum, price) => sum + price, 0) /
            group.suggestedPrices.length
          : null;
      const resolved = resolveDisplayPrice(
        manualByStoreId.get(storeId) ?? null,
        mediaType.basePrice ? Number(mediaType.basePrice) : null,
        averageSuggested,
      );

      const stateCounts = new Map<MapSpaceState, number>();
      for (const state of group.states) {
        stateCounts.set(state, (stateCounts.get(state) ?? 0) + 1);
      }
      const dominantState = [...stateCounts.entries()].sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0];

      return {
        id: crypto.randomUUID(),
        storeId,
        storeName: group.storeName,
        mediaTypeName: mediaType.name,
        quantity: group.states.length,
        price: resolved.value,
        status: dominantState ? SPACE_STATE_META[dominantState].label : "—",
        note: null,
      };
    });

    const photoKeys = [
      ...globalPhotos
        .filter((photo) => photo.code === mediaType.code)
        .map((photo) => photo.imageKey),
      ...mediaType.defaultPhotos,
    ];

    const rowsJson = rows as unknown as Prisma.InputJsonValue;
    const existingPageId = existingPageByCode.get(mediaType.code);
    if (existingPageId) {
      await prisma.tradeCatalogPage.update({
        where: { id: existingPageId },
        data: { rows: rowsJson, photoKeys },
      });
      touchedPageIds.push(existingPageId);
    } else {
      const page = await prisma.tradeCatalogPage.create({
        data: {
          catalogId,
          title: mediaType.name,
          mediaTypeCode: mediaType.code,
          order: nextOrder++,
          photoKeys,
          rows: rowsJson,
        },
        select: { id: true },
      });
      touchedPageIds.push(page.id);
    }
  }

  return touchedPageIds;
}
