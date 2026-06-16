# Etapa 1 — Modelo de dados e migração

> [← Visão geral](./kds-visao-geral.md) · Próxima: [Etapa 2 — API/Router](./kds-etapa-2-api-router.md)

## Por que

O KDS precisa persistir cada pedido da cozinha com **mesa**, **prato**, a **coluna** em que
ele está e os **carimbos de tempo** que viabilizam o cálculo de tempo decorrido/atraso. As
colunas do kanban são **personalizáveis por organização** (nome, cor, ordem, limite WIP,
visibilidade, descrição/ícone) — então **não** usamos mais um enum fixo de status; cada org
tem suas próprias colunas em uma tabela dedicada `KitchenColumn`, e cada `KitchenOrder` aponta
para uma coluna (`columnId`). Na **criação de qualquer organização**, 3 colunas padrão
(Em Preparo → Prontos → Entregues) são **semeadas automaticamente**, dando o comportamento
estilo iFood out-of-the-box sem travar a customização.

Não existe modelo de "Mesa" nem de pedido de cozinha hoje — vamos criar os modelos dedicados
`KitchenColumn` e `KitchenOrder`, isolados por organização (multi-tenant), e adicionar um campo
de **tempo de preparo** ao produto para alimentar a estimativa.

## Arquivos afetados

- `prisma/schema.prisma` (modificar)
- `src/lib/auth.ts` (modificar — seed das colunas padrão no `afterCreateOrganization`)
- Migração gerada em `prisma/migrations/` (novo)
- `src/generated/prisma/*` (regenerado)

## O que fazer

### 1. Sem enum de status (colunas dinâmicas)

O enum `KitchenOrderStatus` **não é mais usado** — o "status" passa a ser a **coluna** para a
qual o pedido aponta. As semânticas especiais (entrada, pronto-para-TV, terminal) viram **flags
booleanas na coluna** (`isInitial`, `showOnTv`, `isFinal`), de modo que qualquer org pode
renomear/recolorir/reordenar/adicionar/remover colunas sem mudança de código.

> Se você estiver migrando um schema que já tinha o enum + `status`/`readyAt`/`deliveredAt`,
> veja a seção **Migração** abaixo (drop do enum e das colunas substituídas).

### 2. Novo modelo `KitchenColumn`

```prisma
model KitchenColumn {
  id             String   @id @default(cuid())
  organizationId String
  name           String                      // nomenclatura editável: "Em Preparo", "Na Brasa"...
  color          String   @default("#64748B") // cor de identificação (hex)
  position       Int                          // ordem no board (0,1,2...)
  wipLimit       Int?                          // limite WIP (null = sem limite)
  isActive       Boolean  @default(true)       // visível/ativa no board
  description    String?                       // texto auxiliar (opcional)
  icon           String?                       // ícone lucide (ex "ChefHat") ou emoji
  isInitial      Boolean  @default(false)      // coluna de entrada: novos pedidos caem aqui
  showOnTv       Boolean  @default(false)      // alimenta o painel da TV (substitui o antigo "PRONTO")
  isFinal        Boolean  @default(false)      // estado terminal: auto-some / fora da TV
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  orders       KitchenOrder[]

  @@index([organizationId, position])
  @@index([organizationId, isActive])
  @@map("kitchen_columns")
}
```

> **Por que `position` não é `@@unique`**: reordenar (swap/insert) com unicidade exige updates
> em duas etapas e é frágil. Mantemos só um índice e ordenamos por `position` na query; o
> endpoint de reorder (Etapa 2) reescreve as posições em transação.

### 3. Novo modelo `KitchenOrder`

```prisma
model KitchenOrder {
  id               String   @id @default(cuid())
  organizationId   String
  columnId         String                       // coluna atual (substitui o antigo enum status)
  tableNumber      String                       // texto livre: "18", "Balcão 3"
  dishName         String
  productId        String?                       // vínculo opcional ao catálogo
  estimatedMinutes Int?                          // snapshot do tempo de preparo na criação
  position         Int      @default(0)          // ordem do card dentro da coluna
  notes            String?
  createdAt        DateTime @default(now())
  columnEnteredAt  DateTime @default(now())      // quando entrou na coluna atual (tempo decorrido + auto-hide)
  createdById      String?

  organization Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  column       KitchenColumn @relation(fields: [columnId], references: [id], onDelete: Restrict)
  product      Product?      @relation(fields: [productId], references: [id], onDelete: SetNull)
  createdBy    User?         @relation("CreatedKitchenOrders", fields: [createdById], references: [id])

  @@index([organizationId, columnId])
  @@index([columnId, position])
  @@index([createdAt])
  @@map("kitchen_orders")
}
```

> **`onDelete: Restrict` na coluna**: impede apagar uma coluna que ainda tem cards (o endpoint
> de delete da Etapa 2 só permite remover colunas vazias, ou exige mover os cards antes).
> **`columnEnteredAt`** substitui `readyAt`/`deliveredAt`: como as colunas são dinâmicas, um
> único carimbo "entrou na coluna atual" alimenta tanto o tempo decorrido quanto a janela de
> auto-sumiço (TV / coluna final). Um log completo de movimentações fica como extensão futura.

### 4. Seed automático das 3 colunas padrão (criação da org)

No hook `afterCreateOrganization` de `src/lib/auth.ts` (onde já se faz o `organization.update`
do `subdomain` e o `enqueueSyncOutbox`), criar as 3 colunas padrão:

```ts
await prisma.kitchenColumn.createMany({
  data: [
    { organizationId: organization.id, name: "Em Preparo", color: "#F97316", position: 0, isInitial: true, icon: "ChefHat" },
    { organizationId: organization.id, name: "Prontos",    color: "#22C55E", position: 1, showOnTv: true,   icon: "BellRing" },
    { organizationId: organization.id, name: "Entregues",  color: "#64748B", position: 2, isFinal: true,    icon: "CheckCheck" },
  ],
});
```

> Toda org nasce com o kanban estilo iFood pronto; o usuário pode editar/adicionar/remover
> colunas depois (Etapa 3). **Backfill**: orgs já existentes não passam pelo hook — rode um
> script/migração de dados único que cria essas 3 colunas para cada org sem colunas.

### 5. Campo de tempo de preparo no produto

No modelo `Product` (perto de `trackStock`):

```prisma
prepTimeMinutes  Int?    // tempo médio de preparo (min) usado pelo KDS
```

### 6. Back-relations

| Modelo | Adicionar |
|--------|-----------|
| `Organization` | `kitchenColumns KitchenColumn[]` e `kitchenOrders KitchenOrder[]` |
| `Product` | `kitchenOrders KitchenOrder[]` |
| `User` | `createdKitchenOrders KitchenOrder[] @relation("CreatedKitchenOrders")` |

### 7. Migração

```bash
npm run db:migrate    # prisma migrate dev  → nome sugerido: kitchen_dynamic_columns
npm run db:generate   # prisma generate     → regenera src/generated/prisma
```

> **Se o schema anterior (com enum) já foi migrado** (é o caso deste repo): a migração precisa
> (1) criar `kitchen_columns`; (2) semear as 3 colunas padrão por org; (3) adicionar
> `kitchen_orders.columnId` + `columnEnteredAt` + `position`; (4) **backfill**: mapear cada
> `status` antigo para a coluna correspondente da org (`EM_PREPARO`→initial, `PRONTO`→showOnTv,
> `ENTREGUE`→final) e copiar `readyAt`/`deliveredAt` para `columnEnteredAt`; (5) **drop** das
> colunas `status`, `readyAt`, `deliveredAt` e do enum `KitchenOrderStatus`. Faça o backfill
> **antes** do drop (migração em SQL custom ou dois passos), para não perder o estado atual.

## Decisões de design

- **Colunas como dados, não como enum**: o "status" vira uma linha em `kitchen_columns`. Isso
  permite renomear, recolorir, reordenar, limitar (WIP), esconder e adicionar/remover colunas
  por org — sem deploy. As semânticas que o código precisa (onde criar, o que mostrar na TV, o
  que é terminal) ficam em flags (`isInitial`, `showOnTv`, `isFinal`), não em nomes de coluna.
- **Seed no `afterCreateOrganization`**: toda org nova já nasce com o kanban de 3 colunas
  estilo iFood; a personalização é opcional.
- **Texto livre + vínculo opcional**: `dishName` é obrigatório; `productId` é opcional. Isso
  honra o fluxo de ficha de papel (a cozinha digita) e ainda permite itens fora do cardápio.
- **`estimatedMinutes` é um snapshot**: gravado na criação para não mudar retroativamente se o
  cardápio for editado depois. Resolução do valor: input do formulário → senão
  `product.prepTimeMinutes` → senão `null` (a UI usa fallback `DEFAULT_PREP_MINUTES = 15`).
- **`columnEnteredAt`**: alimenta o tempo decorrido na coluna atual e a janela de auto-sumiço
  da TV / coluna final (ver Etapas 4 e 5), preservando o registro em vez de deletar.
- **Índices**: `[organizationId, columnId]` cobre as listagens por coluna; `[columnId, position]`
  cobre a ordenação dentro da coluna; `[createdAt]` cobre a ordenação por mais antigo.

## Por que é seguro (não-destrutivo) no caso de schema novo

Para uma base sem o KDS: tabelas novas + colunas todas nullable/novas. Para uma base que já
tinha o enum, o drop das colunas `status`/`readyAt`/`deliveredAt` **é destrutivo** — por isso a
migração faz o **backfill** para `columnId`/`columnEnteredAt` antes do drop.

## Como validar a etapa

```bash
npm run db:migrate
npm run db:studio   # conferir as tabelas kitchen_columns e kitchen_orders
```

- A tabela `kitchen_columns` existe; criar uma org nova gera **3 linhas** (Em Preparo / Prontos
  / Entregues) com `isInitial` / `showOnTv` / `isFinal` corretos.
- A tabela `kitchen_orders` tem `columnId`, `columnEnteredAt`, `position` e os índices acima; o
  enum `KitchenOrderStatus` não existe mais.
- `Product` tem a coluna `prepTimeMinutes` (nullable).
- `npm run db:generate` conclui sem erro e os tipos aparecem em `src/generated/prisma`.
