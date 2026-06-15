# Etapa 3 — Tela da Cozinha (cadastro + kanban)

> [← Etapa 2](./kds-etapa-2-api-router.md) · Próxima: [Etapa 4 — Tempos de preparo](./kds-etapa-4-tempos-preparo.md)

## Por que

É a tela operacional da cozinha: registrar o pedido vindo da ficha de papel e acompanhar o
kanban **Em Preparo → Prontos**. Reaproveita o padrão de hooks de
`src/features/sales/hooks/use-sales.tsx` e os componentes shadcn já existentes.

## Arquivos afetados (novos)

- `src/features/kitchen/hooks/use-kitchen.tsx`
- `src/features/kitchen/components/kitchen-board.tsx`
- `src/features/kitchen/components/register-order-form.tsx`
- `src/features/kitchen/components/order-card.tsx`
- `src/features/kitchen/components/kitchen-column.tsx`
- `src/app/(main)/(rest)/cozinha/page.tsx`

## Hooks — `use-kitchen.tsx`

Espelha `use-sales.tsx` (usa `orpc` + TanStack Query):

```ts
const POLL_MS = 5000;

export function useQueryKitchenOrders(status: "EM_PREPARO" | "PRONTO") {
  return useQuery(
    orpc.kitchen.list.queryOptions({
      input: { status },
      refetchInterval: POLL_MS,   // polling: substitui websockets
    }),
  );
}

export function useMutationCreateKitchenOrder() { /* orpc.kitchen.create.mutationOptions + toast + invalidate */ }
export function useMutationMarkReady()         { /* orpc.kitchen.markReady.mutationOptions + invalidate ambas as listas */ }
export function useMutationMarkDelivered()     { /* orpc.kitchen.markDelivered.mutationOptions + invalidate */ }
```

- **Duas queries** (uma por coluna) — cada uma faz polling e invalida de forma independente.
- Nas mutations, `onSuccess`: `toast.success(...)` + `queryClient.invalidateQueries` das chaves
  de `kitchen.list`. Opcional: **update otimista** para mover o card imediatamente.

## Componentes (reutilizam shadcn de `src/components/ui/`)

`card`, `badge`, `button`, `input`, `select`, `scroll-area`, `form`, `label`.

### `register-order-form.tsx`
- `react-hook-form` + `zod` (`@hookform/resolvers`, já é dependência).
- Campos: **Mesa** (`Input`), **Prato** (`Input` texto livre), **Produto (opcional)**
  (`Select`/combobox reusando a query de produtos existente — ao escolher preenche `productId`
  e sugere `estimatedMinutes`), **Minutos estimados (opcional)** (`Input` numérico).
- Submit → `useMutationCreateKitchenOrder`. Ao salvar com sucesso, limpa o formulário; o pedido
  aparece automaticamente em **Em Preparo** (pela invalidação/polling).

### `order-card.tsx`
- `Card` com título **"Mesa {tableNumber} - {dishName}"**.
- Badge de **tempo decorrido** + **tempo estimado** (detalhado na Etapa 4).
- Botão por coluna:
  - **Em Preparo** → `[ MARCAR COMO PRONTO ]` (chama `markReady`).
  - **Prontos** → `[ ENTREGUE ]` (chama `markDelivered`).

### `kitchen-column.tsx`
- `ScrollArea` com cabeçalho ("Em Preparo" / "Prontos") + `Badge` de contagem.
- Renderiza a lista de `order-card`.

### `kitchen-board.tsx`
- `PageHeader` (reusar `@/components/page-header`) + `register-order-form` + grid de 2 colunas
  (`grid-cols-1 md:grid-cols-2`, empilha no mobile).
- Botão **"Abrir painel da TV"** que abre `/painel/{orgSlug}` em nova aba
  (`target="_blank"`). O `orgSlug` vem da organização ativa.

## Página — `src/app/(main)/(rest)/cozinha/page.tsx`

Wrapper fino renderizando `<KitchenBoard />` (padrão de `vendas/page.tsx`). Já fica atrás de
`requireAuth` + `currentOrganization` graças ao `src/app/(main)/layout.tsx`, herdando sidebar
e header.

## Como validar a etapa

1. `npm run dev`, logar, abrir `/cozinha`.
2. Cadastrar "Mesa 18 - Batata Recheada" → aparece em **Em Preparo** sem recarregar.
3. **[MARCAR COMO PRONTO]** → some de Em Preparo e aparece em **Prontos**.
4. **[ENTREGUE]** → some de Prontos.
5. Abrir em duas abas → mudanças refletem em ~5s (polling) na outra aba.
