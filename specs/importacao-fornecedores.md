# Importação de Fornecedores — Entregue ✅

> Feature: importação em massa de fornecedores via planilha (CSV/XLSX) com
> mapeamento de colunas. Entregue em 2026-07-13.

## O que foi feito

Wizard de 3 passos (upload → mapeamento → progresso), clonando o padrão da
importação de produtos. Processamento **assíncrono via Inngest**, **dedupe por
documento** (pula duplicados) e **`Tipo` como coluna mapeável** (normalizada,
fallback `JURIDICA`).

Arquivos principais:
- `prisma/schema.prisma` — modelo `SupplierImport` + enum `SupplierImportStatus`
  (com `skippedRows`). Migração `add_supplier_import`.
- `src/features/supplier/import-fields.ts` — `SUPPLIER_IMPORT_FIELDS`.
- `src/features/supplier/server/parse-supplier-import.ts` — `mapSupplierRow` +
  `normalizePersonType` (reusa `parseSheet` de produtos).
- `src/features/supplier/server/create-supplier-for-org.ts` — criação reutilizável.
- `src/features/supplier/server/supplier-import-runner.ts` — runner (R2 → parse →
  dedupe → cria linha a linha, com checkpoints).
- `src/lib/inngest/{client,functions}.ts` — evento `suppliers/import.requested` +
  função `supplierImportProcess`.
- `src/app/router/supplier/import/{create,get}.ts` + registro em `index.ts`.
- `src/features/supplier/hooks/use-supplier-import.ts` — mutation + polling.
- `src/features/supplier/components/import/import-wizard.tsx` — wizard.
- `src/app/(main)/(rest)/fornecedores/importar/page.tsx` + botão "Importar".

## Possíveis melhorias futuras (não urgentes)
- [ ] Permitir **atualizar** existentes por documento (hoje só pula duplicados).
- [ ] Baixar um **modelo de planilha** (CSV template) na tela de upload.
- [ ] Suporte a mais campos no import (`addressNumber`, `complement`, `neighborhood`).
- [ ] Histórico de importações (listar `SupplierImport` anteriores).
