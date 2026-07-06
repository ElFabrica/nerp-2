import z from "zod";
import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import { ALL_PERIOD_TYPES } from "../_schemas";

// Sem registro ainda? Devolve os defaults (nada persistido) pra UI já
// renderizar o formulário preenchido — evita side-effect de criar linha
// num GET.
export const getSalesGoalRankingSettings = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "GET",
    summary: "Configurações do ranking da organização",
    tags: ["ranking"],
  })
  .input(z.object({}).optional())
  .handler(async ({ context }) => {
    const settings = await prisma.salesGoalRankingSettings.findUnique({
      where: { organizationId: context.org.id },
    });

    if (!settings) {
      return {
        id: null,
        displayName: "Ranking de Equipes",
        theme: "GAMING" as const,
        activePeriodTypes: [...ALL_PERIOD_TYPES],
        soundEnabled: true,
        scoreSoundUrl: null,
        overtakeSoundUrl: null,
        victorySoundUrl: null,
        soundVolume: 0.6,
        prizes: [] as { position: number; label: string; imageUrl?: string }[],
      };
    }

    return {
      id: settings.id,
      displayName: settings.displayName,
      theme: settings.theme,
      activePeriodTypes: settings.activePeriodTypes,
      soundEnabled: settings.soundEnabled,
      scoreSoundUrl: settings.scoreSoundUrl,
      overtakeSoundUrl: settings.overtakeSoundUrl,
      victorySoundUrl: settings.victorySoundUrl,
      soundVolume: settings.soundVolume,
      prizes: settings.prizes as {
        position: number;
        label: string;
        imageUrl?: string;
      }[],
    };
  });
