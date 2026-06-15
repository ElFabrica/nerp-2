# KDS — Kitchen Display System (Kanban de Cozinha)

> Visão geral e índice das etapas de implementação do painel de cozinha ("Saideira") no nerp.

## Contexto e problema

Hoje o garçom vende no sistema normal, anota o número da mesa numa **ficha de papel** e leva
até a cozinha. Não existe:

- uma tela para a cozinha **registrar** e **acompanhar** o preparo dos pratos;
- um **painel** no salão (TV) mostrando o que já está **pronto para retirada**.

O objetivo é entregar um **Kitchen Display System (KDS)** com três superfícies:

1. **Tela da Cozinha** (`/cozinha`, autenticada) — cadastra o pedido (mesa + prato) e
   gerencia um kanban de duas colunas: **Em Preparo → Prontos**.
2. **Painel da TV** (`/painel/[orgSlug]`, **público**, tela cheia) — exibe **apenas** os
   pedidos prontos para retirada.
3. **Backend** — um modelo `KitchenOrder` e um router oRPC `kitchen`.

### Requisito-chave: tempos de preparo diferentes

Cada prato leva um tempo diferente para ficar pronto. O kanban **não é FIFO rígido**: cada
card avança de forma independente. A tela mostra **tempo decorrido**, **tempo estimado** e
**destaca pedidos atrasados** (ver [Etapa 4](./kds-etapa-4-tempos-preparo.md)).

## Fluxo

```
GARÇOM (sistema atual)
  └─ anota nº da mesa na ficha ──▶ leva à COZINHA

COZINHA  (/cozinha)
  ┌─────────────────────────────┐      ┌─────────────────────────────┐
  │  Cadastrar pedido           │      │  EM PREPARO       │ PRONTOS │
  │  Mesa: [18]                 │ ───▶ │  Mesa 18 - Batata │ ...     │
  │  Prato: [Batata Recheada]   │      │  [MARCAR PRONTO]  │ [ENTREGUE]
  └─────────────────────────────┘      └─────────────────────────────┘
                                                 │ markReady        │ markDelivered
                                                 ▼                  ▼
PAINEL DA TV  (/painel/{orgSlug}, público)
  🍻 {Nome da Organização}
  PEDIDOS PRONTOS PARA RETIRADA
  Mesa 18 - Batata Recheada   (some após ~5 min)
  ─────────────────────────────
  Acompanhe sua mesa no painel.
  Retire no balcão ou solicite a um garçom.
```

## Decisões confirmadas com o cliente

| Tema | Decisão |
|------|---------|
| Campo **Prato** | Texto livre obrigatório **+ vínculo opcional** a um `Product` do catálogo (que fornece o tempo de preparo). Permite itens fora do cardápio. |
| **Painel da TV** | Rota **pública por link** (`/painel/[orgSlug]`), sem login, tela cheia. Mesmo modelo de confiança do storefront/checkout público. |
| **Ciclo do pronto** | Pedido pronto tem botão **[ENTREGUE]** e **some automaticamente da TV após ~5 min** (configurável). Evita lista infinita. |
| **Título da TV** | **Nome dinâmico da organização** (multi-tenant), não fixo "SAIDEIRA". |
| **Tempo real** | **Polling** via React Query `refetchInterval` (não há websockets no projeto). |
| **Papéis** | Sem RBAC novo — qualquer membro autenticado da org usa o KDS (alinhado ao app atual). |

## Stack relevante (confirmada no código)

Next.js 15 (App Router) · TypeScript · Prisma 7 + PostgreSQL · **oRPC** type-safe ·
Better Auth (plugin de organização, multi-tenant) · TanStack React Query v5 ·
Tailwind v4 + Radix + shadcn/ui · Biome (lint/format).

## Etapas de implementação

Cada etapa é **incremental e testável isoladamente**. Implementar na ordem:

| # | Etapa | Documento |
|---|-------|-----------|
| 1 | Modelo de dados + migração | [kds-etapa-1-modelo-dados.md](./kds-etapa-1-modelo-dados.md) |
| 2 | API / Router oRPC `kitchen` | [kds-etapa-2-api-router.md](./kds-etapa-2-api-router.md) |
| 3 | Tela da Cozinha (cadastro + kanban) | [kds-etapa-3-tela-cozinha.md](./kds-etapa-3-tela-cozinha.md) |
| 4 | Tempos de preparo (decorrido/atraso) | [kds-etapa-4-tempos-preparo.md](./kds-etapa-4-tempos-preparo.md) |
| 5 | Painel da TV (público) | [kds-etapa-5-painel-tv.md](./kds-etapa-5-painel-tv.md) |
| 6 | Navegação, papéis e refinamentos | [kds-etapa-6-navegacao-papeis.md](./kds-etapa-6-navegacao-papeis.md) |

## Mapa de arquivos

**Novos**
- `src/app/router/kitchen/{create,list,mark-ready,mark-delivered,public-ready,index}.ts`
- `src/features/kitchen/hooks/use-kitchen.tsx`
- `src/features/kitchen/components/{kitchen-board,register-order-form,order-card,kitchen-column}.tsx`
- `src/features/kitchen/components/tv-display.tsx`
- `src/utils/kitchen-config.ts`
- `src/hooks/use-elapsed.ts`
- `src/app/(main)/(rest)/cozinha/page.tsx`
- `src/app/(kitchen-display)/layout.tsx`
- `src/app/(kitchen-display)/painel/[orgSlug]/page.tsx`

**Modificados**
- `prisma/schema.prisma`
- `src/app/router/index.ts`
- `src/components/app-sidebar.tsx`

## Verificação ponta a ponta (após todas as etapas)

1. `npm run db:migrate` aplica sem erro; `npm run db:generate` ok.
2. `npm run dev`, logar numa org, abrir `/cozinha`.
3. Cadastrar "Mesa 18 - Batata Recheada" → aparece em **Em Preparo** com o tempo subindo.
4. Passar do tempo estimado → card fica âmbar e depois vermelho (atrasado).
5. **[MARCAR COMO PRONTO]** → card vai para **Prontos**.
6. Abrir `/painel/{orgSlug}` em aba anônima → pedido pronto com `🍻 {nome da org}` e o rodapé,
   atualizando sozinho (~5s).
7. **[ENTREGUE]** (ou aguardar a janela) → pedido some da TV e dos Prontos.
8. Isolamento multi-tenant: `/painel/{slug-de-outra-org}` não mostra pedidos desta org.
9. `npm run lint` sem erros.
