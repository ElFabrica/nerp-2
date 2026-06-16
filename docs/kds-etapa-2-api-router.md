# Etapa 2 — API / Router oRPC `kitchen`

> [← Etapa 1](./kds-etapa-1-modelo-dados.md) · Próxima: [Etapa 3 — Tela da Cozinha](./kds-etapa-3-tela-cozinha.md)

## Por que

A tela da cozinha e o painel da TV precisam de endpoints type-safe para **gerenciar as colunas
personalizadas**, **criar/listar pedidos** e **mover um pedido entre colunas**. Como as colunas
são dinâmicas (Etapa 1), o backend trabalha com `columnId` em vez de um enum de status, e expõe
um CRUD de colunas. Seguimos o padrão oRPC já usado em `src/app/router/sales/*`, com isolamento
por organização nos endpoints autenticados e uma rota **pública** (sem login) para a TV —
espelhando `src/app/router/checkout/purchase.ts`.

## Arquivos afetados

**Novos** — `src/app/router/kitchen/`
- Pedidos: `create.ts` · `list.ts` · `move.ts` · `public-ready.ts` · `index.ts`
- Colunas: `columns/list.ts` · `columns/create.ts` · `columns/update.ts` · `columns/delete.ts` · `columns/reorder.ts`

**Modificar**
- `src/app/router/index.ts` — registrar `kitchen: kitchenRoutes`

## Padrão de rota autenticada (referência: `sales/create.ts`)

```ts
import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import z from "zod";

export const createKitchenOrder = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({ method: "POST", summary: "Registrar pedido na cozinha", tags: ["kitchen"] })
  .input(/* ... */)
  .output(/* ... */)
  .handler(async ({ context, input }) => { /* ... */ });
```

> A org vem de `context.org.id` (via `requireOrgMiddleware`). Não há mais enum de status; o
> "status" é `columnId`.

## Endpoints de colunas (`columns/*`)

### `columns/list.ts` — `listKitchenColumns` (GET)

- **Input**: `z.object({ includeInactive: z.boolean().optional() })`
- **Handler**: `findMany` por `organizationId`, `orderBy: { position: "asc" }`. Por padrão só
  `isActive: true`; `includeInactive` traz todas (para a tela de gestão).
- **Output**: array de
  ```ts
  z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    position: z.number(),
    wipLimit: z.number().nullable(),
    isActive: z.boolean(),
    description: z.string().nullable(),
    icon: z.string().nullable(),
    isInitial: z.boolean(),
    showOnTv: z.boolean(),
    isFinal: z.boolean(),
  })
  ```

### `columns/create.ts` — `createKitchenColumn` (POST)

- **Input**
  ```ts
  z.object({
    name: z.string().min(1),
    color: z.string().regex(/^#([0-9a-fA-F]{6})$/).optional(),
    wipLimit: z.number().int().positive().nullable().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    isInitial: z.boolean().optional(),
    showOnTv: z.boolean().optional(),
    isFinal: z.boolean().optional(),
  })
  ```
- **Handler**: calcula `position = (max(position da org) ?? -1) + 1` (vai pro fim). Cria com
  `organizationId: context.org.id`. **Garante unicidade de `isInitial`**: se `isInitial: true`,
  zera o flag das demais colunas da org na mesma transação (uma org só tem **uma** coluna de
  entrada). `showOnTv`/`isFinal` podem repetir.
- **Output**: `z.object({ id: z.string() })`.

### `columns/update.ts` — `updateKitchenColumn` (POST)

- **Input**: `id` + os mesmos campos do create, todos opcionais (patch parcial).
- **Handler**: `updateMany({ where: { id, organizationId }, data })` (filtro de org evita
  cross-tenant). Se `isInitial: true`, reaplica a regra de unicidade. `count === 0` → `NOT_FOUND`.
- **Output**: `z.object({ success: z.boolean() })`.

### `columns/delete.ts` — `deleteKitchenColumn` (POST)

- **Input**: `z.object({ id: z.string() })`
- **Handler**:
  1. Bloqueia apagar a **única** coluna `isInitial` da org → `throw errors.BAD_REQUEST(...)`
     (sempre tem que existir uma coluna de entrada).
  2. Conta cards na coluna; se `> 0` → `throw errors.BAD_REQUEST("Mova ou remova os pedidos
     antes de apagar a coluna")` (casa com `onDelete: Restrict` da Etapa 1).
  3. `deleteMany({ where: { id, organizationId } })`.
- **Output**: `z.object({ success: z.boolean() })`.

### `columns/reorder.ts` — `reorderKitchenColumns` (POST)

- **Input**: `z.object({ order: z.array(z.object({ id: z.string(), position: z.number().int() })) })`
- **Handler**: `prisma.$transaction` com um `updateMany` por item (`where: { id, organizationId }`).
  Atualiza a ordem das colunas de uma vez (drag-and-drop de colunas na tela de gestão).
- **Output**: `z.object({ success: z.boolean() })`.

## Endpoints de pedidos

### `create.ts` — `createKitchenOrder` (POST)

- **Input**
  ```ts
  z.object({
    tableNumber: z.string().min(1),
    dishName: z.string().min(1),
    productId: z.string().optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    notes: z.string().optional(),
    columnId: z.string().optional(), // padrão: a coluna isInitial da org
  })
  ```
- **Handler**: se `estimatedMinutes` ausente e houver `productId`, busca `product.prepTimeMinutes`
  para preencher o snapshot. Resolve a coluna destino: `columnId` informado **ou** a coluna
  `isInitial: true` da org. Cria com `organizationId: context.org.id`,
  `createdById: context.session.userId`, `columnEnteredAt: new Date()` e
  `position = (max position da coluna ?? -1) + 1`.
- **Output**: `z.object({ id: z.string() })`.

### `list.ts` — `listKitchenOrders` (GET)

> O kanban da Etapa 3 tem **N colunas dinâmicas**; a UI lista as colunas (`columns.list`) e os
> pedidos, agrupando por `columnId` no cliente. Não há mais filtro por enum.

- **Input**: `z.object({ columnId: z.string().optional(), recentOnly: z.boolean().optional() })`
- **Handler**: `findMany` por `organizationId` (+ `columnId` se informado),
  `orderBy: [{ column: { position: "asc" } }, { position: "asc" }]`.
  - Para colunas **`isFinal`** (ou quando `recentOnly`), filtra
    `columnEnteredAt >= new Date(Date.now() - AUTO_HIDE_MS)` (janela de recentes — reusa
    `AUTO_HIDE_MS` da [Etapa 4](./kds-etapa-4-tempos-preparo.md); evita lista infinita na coluna
    terminal).
  - Datas serializadas com `.toISOString()` (igual `sales/list.ts`) para o cliente calcular o
    tempo decorrido com o próprio relógio.
- **Output**: array de
  ```ts
  z.object({
    id: z.string(),
    columnId: z.string(),
    tableNumber: z.string(),
    dishName: z.string(),
    estimatedMinutes: z.number().nullable(),
    position: z.number(),
    createdAt: z.string(),         // ISO
    columnEnteredAt: z.string(),   // ISO — tempo na coluna atual + janela de auto-hide
  })
  ```

### `move.ts` — `moveKitchenOrder` (POST) — substitui markReady/markDelivered

> **Um único endpoint** para qualquer transição (colunas dinâmicas ⇒ não dá pra ter
> `markReady`/`markDelivered` fixos). Drag-and-drop e o botão de avançar chamam o **mesmo**
> `move`.

- **Input**: `z.object({ id: z.string(), toColumnId: z.string() })`
- **Handler** (`prisma.$transaction`):
  1. Valida que a coluna destino existe e é da org → senão `NOT_FOUND`.
  2. **Limite WIP**: se `toColumnId.wipLimit != null`, conta cards já na coluna; se
     `count >= wipLimit` → `throw errors.BAD_REQUEST("Limite da coluna atingido")`.
  3. `updateMany({ where: { id, organizationId }, data: { columnId: toColumnId,
     columnEnteredAt: new Date(), position: (max position do destino ?? -1) + 1 } })`.
     `count === 0` → `NOT_FOUND`. Mover para a mesma coluna é no-op idempotente.
- **Output**: `z.object({ success: z.boolean() })`.

> Como as colunas são livres, **não há mais "forward-only" no backend** — qualquer coluna pode
> ir para qualquer coluna (a UI pode opcionalmente restringir, mas o servidor só valida WIP e
> org). O `updateMany` com filtro de org **evita move cross-tenant** e é **idempotente**.

### `public-ready.ts` — `publicReadyOrders` (público, sem auth)

Usa **`base` apenas** (sem `requireAuthMiddleware`/`requireOrgMiddleware`), igual
`checkout/purchase.ts`.

- **Input**: `z.object({ orgSlug: z.string().min(1) })`
- **Handler**:
  1. `const org = await prisma.organization.findUnique({ where: { slug: input.orgSlug } })`;
     se não existir → `throw errors.NOT_FOUND(...)`.
  2. Lê pedidos em colunas com **`showOnTv: true`** daquela org **e**
     `columnEnteredAt >= new Date(Date.now() - AUTO_HIDE_MS)` (janela de auto-sumiço;
     `AUTO_HIDE_MS` definido na Etapa 4), ordenado por `columnEnteredAt desc`.
- **Output**:
  ```ts
  z.object({
    orgName: z.string(),
    orders: z.array(z.object({
      id: z.string(),
      tableNumber: z.string(),
      dishName: z.string(),
      readyAt: z.string(),     // ISO — = columnEnteredAt da coluna showOnTv
    })),
  })
  ```

> **`slug` vs `subdomain`**: `Organization.slug` é `@unique` e sempre presente — escolha mais
> robusta para a URL da TV. (O checkout usa `subdomain`, que é nullable.)
> **`showOnTv` substitui o antigo status `PRONTO`**: a coluna que alimenta a TV é configurável.

## `index.ts` (barrel)

```ts
import { createKitchenOrder } from "./create";
import { listKitchenOrders } from "./list";
import { moveKitchenOrder } from "./move";
import { publicReadyOrders } from "./public-ready";
import { listKitchenColumns } from "./columns/list";
import { createKitchenColumn } from "./columns/create";
import { updateKitchenColumn } from "./columns/update";
import { deleteKitchenColumn } from "./columns/delete";
import { reorderKitchenColumns } from "./columns/reorder";

export const kitchenRoutes = {
  list: listKitchenOrders,
  create: createKitchenOrder,
  move: moveKitchenOrder,
  publicReady: publicReadyOrders,
  columns: {
    list: listKitchenColumns,
    create: createKitchenColumn,
    update: updateKitchenColumn,
    delete: deleteKitchenColumn,
    reorder: reorderKitchenColumns,
  },
};
```

## Registrar no router (`src/app/router/index.ts`)

```ts
import { kitchenRoutes } from "./kitchen";

export const router = {
  // ...rotas existentes
  kitchen: kitchenRoutes,
};
```

## Como validar a etapa

- Type-check / `npm run lint` sem erros.
- `orpc.kitchen.columns.list()` retorna as 3 colunas padrão da org (Em Preparo / Prontos /
  Entregues) ordenadas por `position`.
- `orpc.kitchen.create(...)` retorna `{ id }` e o pedido cai na coluna `isInitial`;
  `orpc.kitchen.list({ columnId })` retorna o pedido criado.
- `orpc.kitchen.move({ id, toColumnId })` move o card; com `wipLimit` atingido lança
  `BAD_REQUEST`.
- `orpc.kitchen.columns.create/update/reorder/delete` funcionam; apagar coluna com cards ou a
  única coluna `isInitial` lança `BAD_REQUEST`.
- `orpc.kitchen.publicReady({ orgSlug })` (sem sessão) retorna `orgName` + pedidos em colunas
  `showOnTv` recentes; slug inexistente lança `NOT_FOUND`.
