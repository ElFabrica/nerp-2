# Etapa 2 — API / Router oRPC `kitchen`

> [← Etapa 1](./kds-etapa-1-modelo-dados.md) · Próxima: [Etapa 3 — Tela da Cozinha](./kds-etapa-3-tela-cozinha.md)

## Por que

A tela da cozinha e o painel da TV precisam de endpoints type-safe para **criar**, **listar**
e **mudar o status** dos pedidos. Seguimos o padrão oRPC já usado em
`src/app/router/sales/*`, com isolamento por organização nos endpoints autenticados e uma
rota **pública** (sem login) para a TV — espelhando `src/app/router/checkout/purchase.ts`.

## Arquivos afetados

**Novos** — `src/app/router/kitchen/`
- `create.ts` · `list.ts` · `mark-ready.ts` · `mark-delivered.ts` · `public-ready.ts` · `index.ts`

**Modificar**
- `src/app/router/index.ts` — registrar `kitchen: kitchenRoutes`

## Padrão de rota autenticada (referência: `sales/create.ts`)

```ts
import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { KitchenOrderStatus } from "@/generated/prisma/enums";
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

> A org vem de `context.org.id` (via `requireOrgMiddleware`) ou de
> `context.session.activeOrganizationId!` (como em `sales/create.ts`). Use `context.org.id`.

## Endpoints

### `create.ts` — `createKitchenOrder` (POST)

- **Input**
  ```ts
  z.object({
    tableNumber: z.string().min(1),
    dishName: z.string().min(1),
    productId: z.string().optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    notes: z.string().optional(),
  })
  ```
- **Handler**: se `estimatedMinutes` ausente e houver `productId`, busca
  `product.prepTimeMinutes` para preencher o snapshot. Cria com `status: "EM_PREPARO"`,
  `organizationId: context.org.id`, `createdById: context.session.userId`.
- **Output**: `z.object({ id: z.string() })`.

### `list.ts` — `listKitchenOrders` (GET)

> O kanban da Etapa 3 tem **3 colunas** (Em Preparo → Prontos → **Entregues**), então a coluna
> Entregues precisa de dados — o `ENTREGUE` deixa de ser excluído incondicionalmente.

- **Input**: `z.object({ status: z.enum(KitchenOrderStatus).optional() })`
- **Handler**: `findMany` por `organizationId` (+ `status` se informado).
  - **EM_PREPARO** ordenado por `createdAt asc` (mais antigo/atrasado no topo).
  - **PRONTO** ordenado por `readyAt desc`.
  - **ENTREGUE**: filtra `deliveredAt >= new Date(Date.now() - AUTO_HIDE_MS)` (janela de
    entregues recentes — reusa a constante `AUTO_HIDE_MS` da [Etapa 4](./kds-etapa-4-tempos-preparo.md);
    evita lista infinita) e ordena por `deliveredAt desc`.
  - Sem `status` informado: comportamento antigo (lista os ativos; entregues antigos fora).
  - Datas serializadas com `.toISOString()` (igual `sales/list.ts`) para o cliente calcular o
    tempo decorrido com o próprio relógio.
- **Output**: array de
  ```ts
  z.object({
    id: z.string(),
    tableNumber: z.string(),
    dishName: z.string(),
    status: z.enum(KitchenOrderStatus),
    estimatedMinutes: z.number().nullable(),
    createdAt: z.string(),               // ISO
    readyAt: z.string().nullable(),      // ISO
    deliveredAt: z.string().nullable(),  // ISO — usado pela coluna/janela de Entregues
  })
  ```

### `mark-ready.ts` — `markKitchenOrderReady` (POST)

- **Input**: `z.object({ id: z.string() })`
- **Handler**: `prisma.kitchenOrder.updateMany({ where: { id, organizationId: context.org.id,
  status: "EM_PREPARO" }, data: { status: "PRONTO", readyAt: new Date() } })`.
  Se `count === 0` → `throw errors.NOT_FOUND(...)`.
- **Output**: `z.object({ success: z.boolean() })`

> Usar `updateMany` com o filtro de org **evita update cross-tenant** e é **idempotente**
> (clicar duas vezes não quebra).

### `mark-delivered.ts` — `markKitchenOrderDelivered` (POST)

- Mesmo padrão, `where: { id, organizationId, status: "PRONTO" }`,
  `data: { status: "ENTREGUE", deliveredAt: new Date() }`.

> **Drag-and-drop usa a mesma API**: na Etapa 3 o `onDragEnd` do kanban dispara `markReady`
> (arrastar p/ Prontos) e `markDelivered` (arrastar p/ Entregues) — os mesmos endpoints que
> os botões de fallback. **Não há endpoint novo**: as transições são forward-only, então não é
> preciso "desfazer status" no backend; drops inválidos são ignorados no cliente (snap back).

### `public-ready.ts` — `publicReadyOrders` (público, sem auth)

Usa **`base` apenas** (sem `requireAuthMiddleware`/`requireOrgMiddleware`), igual
`checkout/purchase.ts`.

- **Input**: `z.object({ orgSlug: z.string().min(1) })`
- **Handler**:
  1. `const org = await prisma.organization.findUnique({ where: { slug: input.orgSlug } })`;
     se não existir → `throw errors.NOT_FOUND(...)`.
  2. Lista `status: "PRONTO"` **e** `readyAt >= new Date(Date.now() - AUTO_HIDE_MS)`
     (janela de auto-sumiço; `AUTO_HIDE_MS` definido na Etapa 4), ordenado por `readyAt desc`.
- **Output**:
  ```ts
  z.object({
    orgName: z.string(),
    orders: z.array(z.object({
      id: z.string(),
      tableNumber: z.string(),
      dishName: z.string(),
      readyAt: z.string(),     // ISO
    })),
  })
  ```

> **`slug` vs `subdomain`**: `Organization.slug` é `@unique` e sempre presente — escolha mais
> robusta para a URL da TV. (O checkout usa `subdomain`, que é nullable.)

## `index.ts` (barrel)

```ts
import { createKitchenOrder } from "./create";
import { listKitchenOrders } from "./list";
import { markKitchenOrderReady } from "./mark-ready";
import { markKitchenOrderDelivered } from "./mark-delivered";
import { publicReadyOrders } from "./public-ready";

export const kitchenRoutes = {
  list: listKitchenOrders,
  create: createKitchenOrder,
  markReady: markKitchenOrderReady,
  markDelivered: markKitchenOrderDelivered,
  publicReady: publicReadyOrders,
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
- Via `orpc` no front (ou um teste manual): `orpc.kitchen.create(...)` retorna `{ id }`;
  `orpc.kitchen.list({ status: "EM_PREPARO" })` retorna o pedido criado.
- `orpc.kitchen.markReady({ id })` move para PRONTO; chamar de novo lança `NOT_FOUND`.
- `orpc.kitchen.publicReady({ orgSlug })` (sem sessão) retorna `orgName` + pedidos prontos
  recentes; slug inexistente lança `NOT_FOUND`.
