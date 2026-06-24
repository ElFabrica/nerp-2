# Etapa 1 — Banco de Dados

## Objetivo

Adicionar o model `PromotionalCatalog` ao schema Prisma para persistir os catálogos por organização.

## Arquivo a modificar

`prisma/schema.prisma`

## Mudanças

### 1. Novo model

```prisma
model PromotionalCatalog {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  config         Json
  createdById    String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy    User         @relation(fields: [createdById], references: [id])

  @@index([organizationId])
}
```

### 2. Relations nos models existentes

No model `Organization`, adicionar:
```prisma
promotionalCatalogs PromotionalCatalog[]
```

No model `User`, adicionar:
```prisma
promotionalCatalogs PromotionalCatalog[]
```

## O campo `config` (Json)

Armazena o objeto `CatalogConfig` serializado. Estrutura esperada:

```typescript
type CatalogConfig = {
  title: string;              // título exibido no topo do catálogo
  subtitle: string;           // subtítulo (ex: "válido até 30/06")
  layout: "grid-2" | "grid-3" | "grid-4" | "list";
  cardStyle: "compact" | "standard" | "detailed";
  sortBy: "discount-desc" | "price-asc" | "price-desc" | "name-asc" | "savings-desc";
  theme: "light" | "dark" | "vibrant";
  showDescription: boolean;
  showCategory: boolean;
  showStock: boolean;
  showSku: boolean;
  excludedProductIds: string[];   // produtos removidos do automático
  manuallyAddedIds: string[];     // produtos adicionados além dos promocionais
  categoryFilter: string[];       // filtrar por slug de categoria ([] = todas)
};
```

## Default config

```typescript
const DEFAULT_CONFIG: CatalogConfig = {
  title: "Promoções",
  subtitle: "",
  layout: "grid-3",
  cardStyle: "standard",
  sortBy: "discount-desc",
  theme: "light",
  showDescription: false,
  showCategory: true,
  showStock: false,
  showSku: false,
  excludedProductIds: [],
  manuallyAddedIds: [],
  categoryFilter: [],
};
```

## Migration

Após editar o schema, rodar:

```bash
npx prisma migrate dev --name add-promotional-catalog
npx prisma generate
```

## Verificação

- `npx prisma studio` → confirmar que a tabela `PromotionalCatalog` foi criada
- Inserir um registro de teste via Studio e confirmar que o campo `config` aceita JSON
