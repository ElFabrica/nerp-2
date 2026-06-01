import prisma from "@/lib/db";
import { deliver } from "@/lib/sync-deliver";
import { inngest, syncNasaRequested } from "./client";

/**
 * Entrega event-driven da SyncOutbox (NERP → NASA).
 *
 * Disparada por `sync/nasa.requested`. Entrega o payload ao NASA via cliente
 * outbound; em falha, o step falha e o Inngest reagenda com backoff exponencial
 * nativo (até `retries` tentativas) — substituindo o backoff manual do antigo
 * cron. A `SyncOutbox` é atualizada apenas para auditoria/observabilidade.
 *
 * `idempotency` na `payload.id` (cuid) evita entregas duplicadas do mesmo
 * registro dentro da janela do Inngest.
 */
export const syncNasaDelivery = inngest.createFunction(
  {
    id: "sync-nasa-delivery",
    triggers: [syncNasaRequested],
    retries: 5,
    idempotency: "event.data.payload.id",
    onFailure: async ({ event, error }) => {
      // Esgotou as tentativas: registra o erro na linha de auditoria, se houver.
      const { outboxId } = event.data.event.data;
      if (!outboxId) return;
      await prisma.syncOutbox
        .update({
          where: { id: outboxId },
          data: {
            attempts: { increment: 1 },
            lastError: (error?.message ?? String(error)).slice(0, 500),
          },
        })
        .catch(() => {});
    },
  },
  async ({ event, step }) => {
    const { type, payload, outboxId } = event.data;

    await step.run("deliver", () => deliver(type, payload));

    if (outboxId) {
      await step.run("mark-delivered", async () => {
        await prisma.syncOutbox
          .update({
            where: { id: outboxId },
            data: { deliveredAt: new Date(), lastError: null },
          })
          .catch(() => {});
      });
    }

    return { delivered: true, type };
  },
);

export const functions = [syncNasaDelivery];
