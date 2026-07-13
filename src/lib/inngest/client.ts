import { Inngest, eventType, staticSchema } from "inngest";
import type { SyncType } from "@/lib/sync-payloads";

/**
 * Cliente Inngest do NERP.
 *
 * Substitui o Vercel Cron: a entrega de eventos de sync (NERP → NASA) deixa de
 * ser por polling da `SyncOutbox` e passa a ser event-driven. Cada mudança de
 * auth emite `sync/nasa.requested`; a função `syncNasaDelivery` entrega ao NASA
 * com retry/backoff nativos do Inngest.
 */

/**
 * Payload do evento de entrega. Carrega o `type` + `payload` canônico (ver
 * `sync-payloads.ts`) e, opcionalmente, o `outboxId` da linha de auditoria em
 * `SyncOutbox` para que a função marque `deliveredAt`.
 */
export type SyncRequestedData = {
  type: SyncType;
  payload: unknown;
  outboxId?: string;
};

// Em dev (`isDev: true`) o SDK entrega ao Dev Server local (`pnpm inngest:dev`)
// e NÃO exige `INNGEST_EVENT_KEY`. Em prod usa a chave do ambiente (Inngest Cloud).
export const inngest = new Inngest({
  id: "nerp",
  isDev: process.env.NODE_ENV !== "production",
});

/**
 * Definição tipada do evento — serve como trigger da função e como fábrica
 * type-safe para `inngest.send(...)`. `staticSchema` dá tipagem em tempo de
 * compilação sem validação em runtime (sem dependência de Zod aqui).
 */
export const syncNasaRequested = eventType("sync/nasa.requested", {
  schema: staticSchema<SyncRequestedData>(),
});

/**
 * Importação de produtos via planilha (CSV/XLSX).
 *
 * Disparado por `products.import.create` após o upload do arquivo ao S3 e a
 * criação da linha `ProductImport`. Carrega apenas o `importId`; a função
 * `productImportProcess` busca o registro, baixa o arquivo e processa em lotes.
 */
export type ProductImportRequestedData = { importId: string };

export const productImportRequested = eventType("products/import.requested", {
  schema: staticSchema<ProductImportRequestedData>(),
});

/**
 * Importação de fornecedores via planilha (CSV/XLSX).
 *
 * Disparado por `supplier.import.create` após o upload do arquivo ao S3 e a
 * criação da linha `SupplierImport`. Carrega apenas o `importId`; a função
 * `supplierImportProcess` busca o registro, baixa o arquivo e processa as linhas.
 */
export type SupplierImportRequestedData = { importId: string };

export const supplierImportRequested = eventType("suppliers/import.requested", {
  schema: staticSchema<SupplierImportRequestedData>(),
});

/**
 * Geração do Book em PDF (Trade Marketing).
 *
 * Disparado por `book.generate` após marcar o Book como GENERATING. A função
 * `bookGenerate` carrega o book + itens (fotos do PDV) + logos e renderiza o
 * PDF server-side (@react-pdf/renderer), salvando em R2 e marcando READY.
 */
export type BookGenerateRequestedData = { bookId: string };

export const bookGenerateRequested = eventType("book/generate.requested", {
  schema: staticSchema<BookGenerateRequestedData>(),
});
