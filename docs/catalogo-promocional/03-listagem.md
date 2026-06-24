# Etapa 3 — Página de Listagem

## Objetivo

Página inicial do módulo onde o admin vê todos os catálogos salvos e pode criar novos.

---

## Rota

```
/[orgSlug]/catalogo-promocional
```

Arquivo: `src/app/(main)/[orgSlug]/catalogo-promocional/page.tsx`

---

## Componente principal

`src/features/promotional-catalog/catalog-list.tsx`

### Layout

```
┌─────────────────────────────────────────────────┐
│  Catálogo Promocional          [+ Novo Catálogo] │
│  ─────────────────────────────────────────────   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │          │  │          │  │          │       │
│  │ Promoções│  │ Ofertas  │  │ Catálogo │       │
│  │ de Julho │  │ de Natal │  │ de Verão │       │
│  │          │  │          │  │          │       │
│  │ 12 prod. │  │ 8 prod.  │  │ 5 prod.  │       │
│  │ 2d atrás │  │ 5d atrás │  │ 1sem     │       │
│  │ [Editar] │  │ [Editar] │  │ [Editar] │       │
│  │ [...]    │  │ [...]    │  │ [...]    │       │
│  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────┘
```

### Estado vazio

Quando não há catálogos:
- Ícone (ex: `Tag` do Lucide)
- Texto: "Nenhum catálogo criado ainda"
- Botão "Criar primeiro catálogo"

---

## Componente `catalog-card.tsx`

`src/features/promotional-catalog/components/catalog-card.tsx`

Props:
```typescript
type CatalogCardProps = {
  id: string;
  name: string;
  updatedAt: Date;
};
```

Ações disponíveis no card (Dropdown Menu com `...`):
- **Editar** → navega para `/[orgSlug]/catalogo-promocional/[id]`
- **Renomear** → Dialog inline com input
- **Duplicar** → cria cópia com nome "Cópia de [nome]"
- **Excluir** → AlertDialog de confirmação

---

## Hook `use-catalog.ts`

`src/features/promotional-catalog/hooks/use-catalog.ts`

```typescript
// Listagem
function usePromotionalCatalogs(): { data, isLoading, error }

// Criar
function useCreateCatalog(): { mutate, isPending }
// Após criar: navega para /[orgSlug]/catalogo-promocional/[newId]

// Deletar
function useDeleteCatalog(): { mutate, isPending }

// Duplicar (cria com config copiada)
function useDuplicateCatalog(): { mutate, isPending }
```

---

## Fluxo "Novo Catálogo"

1. Admin clica em "Novo Catálogo"
2. Dialog abre pedindo o nome (campo obrigatório)
3. Ao confirmar: `createCatalog({ name })` → API cria com DEFAULT_CONFIG
4. Redireciona para o editor: `router.push(`/[orgSlug]/catalogo-promocional/[newId]`)`

---

## Verificação

- Acessar a rota sem catálogos → ver estado vazio com CTA
- Criar catálogo → aparecer na lista → clicar editar → ir para o editor
- Renomear → nome atualiza na lista sem recarregar a página
- Duplicar → novo card aparece com nome "Cópia de ..."
- Excluir → confirmação → card some da lista
