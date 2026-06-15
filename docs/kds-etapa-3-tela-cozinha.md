# Etapa 3 — Tela da Cozinha (cadastro + kanban drag-and-drop)

> [← Etapa 2](./kds-etapa-2-api-router.md) · Próxima: [Etapa 4 — Tempos de preparo](./kds-etapa-4-tempos-preparo.md)

## Por que

É a tela operacional da cozinha: registrar o pedido vindo da ficha de papel e acompanhar um
kanban de **3 colunas estilo iFood** — **Em Preparo → Prontos → Entregues**. O avanço de
status é feito **arrastando o card** entre as colunas (drag-and-drop com `@dnd-kit`), com um
**botão de avançar como fallback** em cada card (mobile/acessibilidade). Reaproveita o padrão
de hooks de `src/features/sales/hooks/use-sales.tsx` e os componentes shadcn já existentes.

## Dependência nova

O drag-and-drop usa **`@dnd-kit`** (única dependência nova desta etapa):

```bash
npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Arquivos afetados (novos)

- `src/features/kitchen/hooks/use-kitchen.tsx`
- `src/features/kitchen/hooks/use-kanban-dnd.ts`  ← lógica de arraste (onDragEnd + activeId)
- `src/features/kitchen/components/kitchen-board.tsx`
- `src/features/kitchen/components/register-order-form.tsx`
- `src/features/kitchen/components/order-card.tsx`
- `src/features/kitchen/components/kitchen-column.tsx`
- `src/app/(main)/(rest)/cozinha/page.tsx`

## Colunas do kanban

Array central reutilizado por board, colunas e pela lógica de arraste:

```ts
export const KANBAN_COLUMNS = [
  { id: "EM_PREPARO", title: "Em Preparo" },
  { id: "PRONTO",     title: "Prontos" },
  { id: "ENTREGUE",   title: "Entregues" },
] as const;

// Transições forward-only permitidas (origem → destino)
const TRANSITIONS = {
  EM_PREPARO: "PRONTO",   // arrastar p/ Prontos  ⇒ markReady
  PRONTO:     "ENTREGUE", // arrastar p/ Entregues ⇒ markDelivered
} as const;
```

## Hooks — `use-kitchen.tsx`

Espelha `use-sales.tsx` (usa `orpc` + TanStack Query):

```ts
const POLL_MS = 5000;

export function useQueryKitchenOrders(status: "EM_PREPARO" | "PRONTO" | "ENTREGUE") {
  return useQuery(
    orpc.kitchen.list.queryOptions({
      input: { status },
      refetchInterval: POLL_MS,   // polling: substitui websockets
    }),
  );
}

export function useMutationCreateKitchenOrder() { /* orpc.kitchen.create.mutationOptions + toast + invalidate */ }
export function useMutationMarkReady()         { /* orpc.kitchen.markReady.mutationOptions + invalidate as 3 listas */ }
export function useMutationMarkDelivered()     { /* orpc.kitchen.markDelivered.mutationOptions + invalidate */ }
```

- **Três queries** (uma por coluna) — cada uma faz polling e invalida de forma independente.
  A coluna **Entregues** lista só os entregues **recentes** (janela de tempo, ver
  [Etapa 2](./kds-etapa-2-api-router.md) — `list.ts`).
- Nas mutations, `onSuccess`: `toast.success(...)` + `queryClient.invalidateQueries` das chaves
  de `kitchen.list`.
- **Update otimista (recomendado)**: em `onMutate`, mover o card da lista de origem para a de
  destino imediatamente (e fazer rollback em `onError`). Como o arraste já reposiciona o card
  visualmente, o otimismo evita um "pisca" até o próximo refetch/polling.

## Drag-and-drop — `use-kanban-dnd.ts`

Encapsula o estado e a regra de transição do `DndContext`:

```ts
export function useKanbanDnd() {
  const [activeId, setActiveId] = useState<string | null>(null); // p/ o DragOverlay
  const markReady = useMutationMarkReady();
  const markDelivered = useMutationMarkDelivered();

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const from = event.active.data.current?.status;          // coluna de origem
    const to = event.over?.data.current?.status ?? event.over?.id; // coluna de destino
    if (!from || !to || from === to) return;                  // mesma coluna ⇒ snap back

    if (from === "EM_PREPARO" && to === "PRONTO") {
      markReady.mutate({ id: event.active.id as string });
    } else if (from === "PRONTO" && to === "ENTREGUE") {
      markDelivered.mutate({ id: event.active.id as string });
    }
    // qualquer outra combinação (voltar, pular etapa) ⇒ ignora ⇒ snap back
  }

  return { activeId, setActiveId, onDragEnd };
}
```

- **Forward-only**: só `EM_PREPARO→PRONTO` e `PRONTO→ENTREGUE` disparam mutation. Voltar uma
  coluna ou pular etapa é **ignorado** — o `@dnd-kit` devolve o card ao lugar (snap back), sem
  ida ao servidor. Não há endpoint de "desfazer".

## Componentes (reutilizam shadcn de `src/components/ui/`)

`card`, `badge`, `button`, `input`, `select`, `scroll-area`, `form`, `label`.

### `register-order-form.tsx`
- `react-hook-form` + `zod` (`@hookform/resolvers`, já é dependência).
- Campos: **Mesa** (`Input`), **Prato** (`Input` texto livre), **Produto (opcional)**
  (`Select`/combobox reusando a query de produtos existente — ao escolher preenche `productId`
  e sugere `estimatedMinutes`), **Minutos estimados (opcional)** (`Input` numérico).
- Submit → `useMutationCreateKitchenOrder`. Ao salvar com sucesso, limpa o formulário; o pedido
  aparece automaticamente em **Em Preparo** (pela invalidação/polling).

### `order-card.tsx`  (sortable / draggable)
- `useSortable({ id: order.id, data: { status } })` do `@dnd-kit/sortable`; aplica
  `transform`/`transition` via `@dnd-kit/utilities` (`CSS.Transform.toString(transform)`).
- `Card` no estilo iFood: título **"Mesa {tableNumber} · {dishName}"**.
- **Handle de arraste** (ícone grip `⠿`) com `{...attributes} {...listeners}` — só o handle
  inicia o arraste, para não conflitar com cliques/scroll.
- Badge de **tempo decorrido** + **tempo estimado** (detalhado na Etapa 4).
- **Botão de avançar (fallback)** — caminho não-arraste:
  - **Em Preparo** → `[→ Pronto]` (chama `markReady`).
  - **Prontos** → `[→ Entregue]` (chama `markDelivered`).
  - **Entregues** → sem botão (estado final).

### `kitchen-column.tsx`  (droppable)
- `useDroppable({ id: status, data: { status } })` do `@dnd-kit/core`.
- `SortableContext` (`verticalListSortingStrategy`) envolvendo os `order-card` da coluna.
- `ScrollArea` com cabeçalho ("Em Preparo" / "Prontos" / "Entregues") + `Badge` de contagem.
- Realça a área quando um card está sobre ela (`isOver`) — feedback de drop estilo iFood.

### `kitchen-board.tsx`  (DndContext)
- `PageHeader` (reusar `@/components/page-header`) + `register-order-form` + grid de 3 colunas
  (`grid-cols-1 md:grid-cols-3`, empilha no mobile).
- Hospeda o **`DndContext`**:
  - `sensors`: `PointerSensor` (com `activationConstraint: { distance: 5 }`) +
    `KeyboardSensor` (`coordinateGetter: sortableKeyboardCoordinates`) para acessibilidade.
  - `collisionDetection: closestCorners`.
  - `onDragStart` → `setActiveId(event.active.id)`; `onDragEnd` → handler do `use-kanban-dnd`.
  - **`DragOverlay`** renderiza um "fantasma" do `order-card` ativo durante o arraste.
- Botão **"Abrir painel da TV"** que abre `/painel/{orgSlug}` em nova aba
  (`target="_blank"`). O `orgSlug` vem da organização ativa.

## Página — `src/app/(main)/(rest)/cozinha/page.tsx`

Wrapper fino renderizando `<KitchenBoard />` (padrão de `vendas/page.tsx`). Já fica atrás de
`requireAuth` + `currentOrganization` graças ao `src/app/(main)/layout.tsx`, herdando sidebar
e header.

## Como validar a etapa

1. `npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`, `npm run dev`, logar, abrir
   `/cozinha`.
2. Cadastrar "Mesa 18 - Batata Recheada" → aparece em **Em Preparo** sem recarregar.
3. **Arrastar** o card de Em Preparo → **Prontos** (chama `markReady`); arrastar de Prontos →
   **Entregues** (chama `markDelivered`).
4. **Fallback por botão**: `[→ Pronto]` e `[→ Entregue]` avançam o card sem arrastar.
5. **Drop inválido**: arrastar de Prontos de volta para Em Preparo (ou pular etapa) → o card
   **volta ao lugar** (snap back) e nada muda no servidor.
6. Abrir em duas abas → mudanças refletem em ~5s (polling) na outra aba.
7. **Acessibilidade**: focar um card via teclado, espaço para "pegar", setas para mover,
   espaço para soltar.
