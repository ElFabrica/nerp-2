# Etapa 1 — Modelo de dados e migração

> [← Visão geral](./kds-visao-geral.md) · Próxima: [Etapa 2 — API/Router](./kds-etapa-2-api-router.md)

## Por que

O KDS precisa persistir cada pedido da cozinha com **mesa**, **prato**, **status**
(Em Preparo → Pronto → Entregue) e os **carimbos de tempo** que viabilizam o cálculo de
tempo decorrido/atraso. Não existe modelo de "Mesa" nem de pedido de cozinha hoje — vamos
criar um modelo dedicado `KitchenOrder`, isolado por organização (multi-tenant), e adicionar
um campo de **tempo de preparo** ao produto para alimentar a estimativa.

## Arquivos afetados

- `prisma/schema.prisma` (modificar)
- Migração gerada em `prisma/migrations/` (novo)
- `src/generated/prisma/*` (regenerado)

## O que fazer

### 1. Novo enum

Adicionar junto aos demais enums do schema:

```prisma
enum KitchenOrderStatus {
  EM_PREPARO
  PRONTO
  ENTREGUE
}
```

### 2. Novo modelo `KitchenOrder`

```prisma
model KitchenOrder {
  id               String             @id @default(cuid())
  organizationId   String
  tableNumber      String                       // texto livre: "18", "Balcão 3"
  dishName         String
  productId        String?                       // vínculo opcional ao catálogo
  estimatedMinutes Int?                          // snapshot do tempo de preparo na criação
  status           KitchenOrderStatus @default(EM_PREPARO)
  notes            String?
  createdAt        DateTime           @default(now())
  readyAt          DateTime?
  deliveredAt      DateTime?
  createdById      String?

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  product      Product?     @relation(fields: [productId], references: [id], onDelete: SetNull)
  createdBy    User?        @relation("CreatedKitchenOrders", fields: [createdById], references: [id])

  @@index([organizationId, status])
  @@index([createdAt])
  @@map("kitchen_orders")
}
```

### 3. Campo de tempo de preparo no produto

No modelo `Product` (perto de `trackStock`):

```prisma
prepTimeMinutes  Int?    // tempo médio de preparo (min) usado pelo KDS
```

### 4. Back-relations

| Modelo | Adicionar |
|--------|-----------|
| `Organization` | `kitchenOrders KitchenOrder[]` |
| `Product` | `kitchenOrders KitchenOrder[]` |
| `User` | `createdKitchenOrders KitchenOrder[] @relation("CreatedKitchenOrders")` |

### 5. Migração

```bash
npm run db:migrate    # prisma migrate dev  → nome sugerido: add_kitchen_orders
npm run db:generate   # prisma generate     → regenera src/generated/prisma
```

> O enum é importado de `@/generated/prisma/enums` (mesmo padrão de `SaleStatus`,
> `PaymentMethod` usados em `src/app/router/sales/create.ts`).

## Decisões de design

- **Texto livre + vínculo opcional**: `dishName` é obrigatório; `productId` é opcional. Isso
  honra o fluxo de ficha de papel (a cozinha digita) e ainda permite itens fora do cardápio.
- **`estimatedMinutes` é um snapshot**: gravado na criação para não mudar retroativamente se o
  cardápio for editado depois. Resolução do valor: input do formulário → senão
  `product.prepTimeMinutes` → senão `null` (a UI usa fallback `DEFAULT_PREP_MINUTES = 15`).
- **`status` com `ENTREGUE`**: terceiro estado que alimenta a **coluna Entregues** do kanban
  (arrastar p/ Entregues ou botão de fallback) e o auto-sumiço da TV (ver Etapas 2, 3 e 5), em
  vez de deletar o registro (preserva histórico).
- **Índices**: `[organizationId, status]` cobre as listagens por coluna; `[createdAt]` cobre a
  ordenação por mais antigo.

## Por que é seguro (não-destrutivo)

Tabela nova + colunas todas nullable / novas. Nenhuma alteração em dados existentes.

## Como validar a etapa

```bash
npm run db:migrate
npm run db:studio   # conferir a tabela kitchen_orders e o enum
```

- A tabela `kitchen_orders` existe com as colunas e índices acima.
- `Product` tem a coluna `prepTimeMinutes` (nullable).
- `npm run db:generate` conclui sem erro e os tipos aparecem em `src/generated/prisma`.
