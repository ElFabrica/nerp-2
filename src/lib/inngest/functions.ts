import prisma from "@/lib/db";
import { deliver } from "@/lib/sync-deliver";
import { runProductImport } from "@/features/products/server/import-runner";
import { inngest, productImportRequested, syncNasaRequested } from "./client";

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

/**
 * Importação de produtos via planilha (CSV/XLSX).
 *
 * Disparada por `products/import.requested`. Processa o arquivo num único
 * `step.run` — `runProductImport` faz importação parcial (erros por linha não
 * abortam o lote), então o step só falha em erros de infraestrutura (S3/DB), que
 * o Inngest reagenda com backoff. Como o step é memoizado quando bem-sucedido,
 * ele não reexecuta após concluir. `onFailure` marca o registro como `FAILED`.
 */
export const productImportProcess = inngest.createFunction(
  {
    id: "product-import-process",
    triggers: [productImportRequested],
    retries: 2,
    concurrency: { limit: 5 },
    onFailure: async ({ event, error }) => {
      const { importId } = event.data.event.data;
      await prisma.productImport
        .update({
          where: { id: importId },
          data: {
            status: "FAILED",
            completedAt: new Date(),
          },
        })
        .catch(() => {});
      console.error(`[product-import] falha em ${importId}:`, error);
    },
  },
  async ({ event, step }) => {
    const { importId } = event.data;

    await step.run("process-import", () => runProductImport(importId));

    return { importId, done: true };
  }
);

export const functions = [syncNasaDelivery, productImportProcess];
