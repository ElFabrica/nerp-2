# Etapa 2 — API Routes (oRPC)

## Objetivo

Criar as rotas de CRUD para `PromotionalCatalog` seguindo o padrão oRPC já utilizado no projeto, e estender o endpoint de listagem de produtos para suportar filtro de produtos em promoção com ordenação por desconto.

---

## Arquivos a criar

### `src/app/router/promotional-catalog/list.ts`

Lista todos os catálogos da organização ativa (apenas id, name, updatedAt — sem config).

```typescript
// Input: nenhum (usa organizationId da sessão)
// Output: { id, name, updatedAt }[]
```

### `src/app/router/promotional-catalog/get.ts`

Busca um catálogo completo por id (inclui config JSON).

```typescript
// Input: { id: string }
// Output: { id, name, config, createdAt, updatedAt }
// Erro 404 se não pertencer à org do usuário
```

### `src/app/router/promotional-catalog/create.ts`

Cria um novo catálogo com nome e config default.

```typescript
// Input: { name: string }
// Output: { id, name, config }
// Usa DEFAULT_CONFIG como valor inicial do campo config
```

### `src/app/router/promotional-catalog/update.ts`

Atualiza nome e/ou config de um catálogo existente.

```typescript
// Input: { id: string, name?: string, config?: Partial<CatalogConfig> }
// Output: { id, name, updatedAt }
// Faz merge do config parcial com o config existente
```

### `src/app/router/promotional-catalog/delete.ts`

Remove um catálogo.

```typescript
// Input: { id: string }
// Output: { success: true }
// Verifica ownership antes de deletar
```

### `src/app/router/promotional-catalog/index.ts`

Agrega as rotas no router principal.

```typescript
export const promotionalCatalogRouter = {
  list,
  get,
  create,
  update,
  delete: deleteRoute,
};
```

---

## Arquivo a modificar

### `src/app/router/catalog/list-products.ts`

Adicionar ao input schema:

```typescript
onlyPromotional: z.boolean().optional(),
sortBy: z.enum([
  "salePrice_asc",
  "salePrice_desc",
  "name_asc",
  "discount_desc",   // maior desconto % primeiro
  "savings_desc",    // maior economia R$ primeiro
]).optional(),
productIds: z.array(z.string()).optional(), // para buscar ids específicos (manuallyAddedIds)
```

No Prisma query, adicionar condição:

```typescript
where: {
  ...existingWhere,
  ...(input.onlyPromotional && {
    promotionalPrice: { not: null },
    NOT: { id: { in: input.excludedIds ?? [] } },
  }),
  ...(input.productIds?.length && {
    OR: [
      { promotionalPrice: { not: null } },
      { id: { in: input.productIds } },
    ],
  }),
}
```

Ordenação no JS (pós-query) para `discount_desc` e `savings_desc`, pois são calculados:

```typescript
if (sortBy === "discount_desc") {
  products.sort((a, b) => {
    const discA = (a.salePrice - a.promotionalPrice!) / a.salePrice;
    const discB = (b.salePrice - b.promotionalPrice!) / b.salePrice;
    return discB - discA;
  });
}
```

---

## `src/app/router/index.ts`

Registrar o novo router:

```typescript
import { promotionalCatalogRouter } from "./promotional-catalog";

export const router = {
  ...existingRouters,
  promotionalCatalog: promotionalCatalogRouter,
};
```

---

## Segurança

Todas as rotas do `promotional-catalog`:
- Requerem sessão autenticada (`protectedMiddleware` já existente no projeto)
- Verificam `organizationId` do catálogo === `session.session.activeOrganizationId`
- Nunca retornam catálogos de outras organizações

---

## Verificação

- Usar a DevTools do browser com o Network tab para confirmar que as rotas respondem
- Criar catálogo via API → listar → buscar por id → atualizar → deletar
- Confirmar que tentar buscar catálogo de outra org retorna erro
