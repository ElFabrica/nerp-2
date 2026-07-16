import z from "zod";
import { base } from "@/app/middlewares/base";
import {
  buildCollaboratorPhotoMap,
  normalizeCollaboratorName,
} from "@/features/ranking/lib/collaborator-name-match";
import prisma from "@/lib/db";
import { buildSalesGoalRanking } from "./_ranking-data";
import { periodTypeSchema } from "./_schemas";

// Rota pública (sem requireAuth): ranking da org identificada pelo slug, para
// a página de TV deslogada — mesmo modelo do painel do garçom. Só leitura: não
// expõe memberId nem branches inativas. A foto do vendedor é resolvida aqui
// (fallback pelo nome do colaborador) porque a tela pública não pode consultar
// a lista de colaboradores, que é autenticada.
export const publicListSalesGoalRanking = base
  .route({
    method: "GET",
    summary: "Ranking de metas do período (público)",
    tags: ["ranking"],
  })
  .input(
    z.object({
      orgSlug: z.string().min(1),
      periodType: periodTypeSchema,
      periodStart: z.string().optional(),
    }),
  )
  .handler(async ({ input, errors }) => {
    const org = await prisma.organization.findUnique({
      where: { slug: input.orgSlug },
      select: { id: true },
    });

    if (!org) {
      throw errors.NOT_FOUND({ message: "Organização não encontrada!" });
    }

    const period = await buildSalesGoalRanking(org.id, {
      periodType: input.periodType,
      periodStart: input.periodStart,
    });

    if (!period) return null;

    const collaborators = await prisma.collaborator.findMany({
      where: { organizationId: org.id, isActive: true },
      select: { name: true, photoUrl: true },
    });
    const photoByName = buildCollaboratorPhotoMap(collaborators);

    return {
      ...period,
      branches: period.branches.map((branch) => ({
        ...branch,
        entries: branch.entries.map(({ memberId: _memberId, ...entry }) => ({
          ...entry,
          photoUrl:
            entry.photoUrl ??
            photoByName.get(normalizeCollaboratorName(entry.sellerName)) ??
            null,
        })),
      })),
    };
  });
