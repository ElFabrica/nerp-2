import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { MapObjectType, type Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db";
import { z } from "zod";

const vec2 = z.object({ x: z.number(), y: z.number() });

const geometrySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("RECT"),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    rotation: z.number(),
  }),
  z.object({ kind: z.literal("POLYGON"), points: z.array(vec2) }),
  z.object({ kind: z.literal("POLYLINE"), points: z.array(vec2) }),
  z.object({ kind: z.literal("POINT"), x: z.number(), y: z.number() }),
]);

const styleSchema = z.object({
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  opacity: z.number().optional(),
});

const objectSchema = z.object({
  id: z.string(),
  type: z.enum(MapObjectType),
  layerId: z.string(),
  geometry: geometrySchema,
  z: z.number().int(),
  heightM: z.number().nullable().optional(),
  style: styleSchema.optional(),
  name: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  responsibleName: z.string().nullable().optional(),
  lastVisitAt: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  brandId: z.string().nullable().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export const bulkUpsertMapObjects = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      floorPlanId: z.string(),
      objects: z.array(objectSchema),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    if (input.objects.length === 0) return { success: true };

    const floorPlan = await prisma.floorPlan.findFirst({
      where: { id: input.floorPlanId, organizationId: context.org.id },
      select: { id: true, layers: { select: { id: true } } },
    });

    if (!floorPlan) {
      throw errors.NOT_FOUND({ message: "Mapa não encontrado" });
    }

    const layerIds = new Set(floorPlan.layers.map((layer) => layer.id));
    for (const object of input.objects) {
      if (!layerIds.has(object.layerId)) {
        throw errors.BAD_REQUEST({
          message: "Camada inválida para este mapa",
        });
      }
    }

    // Só atualiza ids já pertencentes a este mapa; os demais são criados.
    // Isso evita que um id de outra organização seja sobrescrito.
    const existing = await prisma.mapObject.findMany({
      where: { floorPlanId: input.floorPlanId, organizationId: context.org.id },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((object) => object.id));

    await prisma.$transaction(
      input.objects.map((object) => {
        const shared = {
          type: object.type,
          layerId: object.layerId,
          shapeKind: object.geometry.kind,
          geometry: object.geometry as Prisma.InputJsonValue,
          z: object.z,
          heightM: object.heightM ?? null,
          style: (object.style ?? {}) as Prisma.InputJsonValue,
          name: object.name ?? null,
          status: object.status ?? null,
          category: object.category ?? null,
          responsibleName: object.responsibleName ?? null,
          lastVisitAt: object.lastVisitAt ? new Date(object.lastVisitAt) : null,
          supplierId: object.supplierId ?? null,
          brandId: object.brandId ?? null,
          properties: (object.properties ?? {}) as Prisma.InputJsonValue,
        };

        if (existingIds.has(object.id)) {
          return prisma.mapObject.update({
            where: { id: object.id },
            data: shared,
          });
        }

        return prisma.mapObject.create({
          data: {
            id: object.id,
            organizationId: context.org.id,
            floorPlanId: input.floorPlanId,
            ...shared,
          },
        });
      }),
    );

    return { success: true };
  });
