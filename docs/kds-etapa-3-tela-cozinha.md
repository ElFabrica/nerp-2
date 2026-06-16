# Etapa 3 — Tela da Cozinha (cadastro + kanban drag-and-drop + colunas personalizáveis)

> [← Etapa 2](./kds-etapa-2-api-router.md) · Próxima: [Etapa 4 — Tempos de preparo](./kds-etapa-4-tempos-preparo.md)

## Por que

É a tela operacional da cozinha: registrar o pedido vindo da ficha de papel e acompanhar um
kanban de **colunas personalizáveis** estilo iFood. Cada organização nasce com **3 colunas
padrão** (Em Preparo → Prontos → Entregues) criadas automaticamente na criação da org
(ver [Etapa 1](./kds-etapa-1-modelo-dados.md) — seed no `afterCreateOrganization`), mas o
usuário pode **renomear, recolorir, reordenar, limitar (WIP), esconder e adicionar/remover
colunas**. O avanço de status é feito **arrastando o card** entre as colunas (drag-and-drop com
`@dnd-kit`), com um **botão de avançar como fallback** em cada card (mobile/acessibilidade).
Reaproveita o padrão de hooks de `src/features/sales/hooks/use-sales.tsx` e os componentes
shadcn já existentes.

## Dependência nova

O drag-and-drop usa **`@dnd-kit`** (única dependência nova desta etapa):

```bash
npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Arquivos afetados (novos)

- `src/features/kitchen/hooks/use-kitchen.tsx`        ← pedidos (list/create/move)
- `src/features/kitchen/hooks/use-kitchen-columns.tsx` ← colunas (list/create/update/delete/reorder)
- `src/features/kitchen/hooks/use-kanban-dnd.ts`       ← lógica de arraste (onDragEnd + activeId)
- `src/features/kitchen/components/kitchen-board.tsx`
- `src/features/kitchen/components/register-order-form.tsx`
- `src/features/kitchen/components/order-card.tsx`
- `src/features/kitchen/components/kitchen-column.tsx`
- `src/features/kitchen/components/column-manager.tsx`  ← dialog/sheet de gestão de colunas
- `src/features/kitchen/components/column-form.tsx`     ← form de criar/editar coluna
- `src/app/(main)/(rest)/cozinha/page.tsx`

## Colunas do kanban — agora dinâmicas (vêm do servidor)

Não há mais um array hardcoded. As colunas vêm de `orpc.kitchen.columns.list` e cada coluna
carrega seus campos editáveis:

```ts
type KitchenColumn = {
  id: string;
  name: string;          // nomenclatura editável
  color: string;         // cor de identificação (hex) — borda/cabeçalho da coluna
  position: number;      // ordem no board
  wipLimit: number | null; // limite WIP (null = sem limite)
  isActive: boolean;     // visível/ativa no board
  description: string | null;
  icon: string | null;   // ícone lucide (ex "ChefHat") ou emoji
  isInitial: boolean;    // coluna de entrada (novos pedidos caem aqui)
  showOnTv: boolean;     // alimenta o painel da TV
  isFinal: boolean;      // terminal (auto-some / janela de recentes)
};
```

- **Transições livres**: arrastar um card de qualquer coluna para qualquer coluna chama
  `kitchen.move` (Etapa 2). Não há mais regra forward-only fixa — o backend só valida org e
  **limite WIP** da coluna destino. (Opcional: a UI pode bloquear soltar numa coluna que estourou
  o WIP, dando feedback visual de "coluna cheia".)
- **Coluna de entrada**: novos pedidos do formulário caem na coluna `isInitial`.
- **As 3 padrão são criadas na org** (Etapa 1) — esta tela nunca precisa "garantir" colunas;
  se a lista vier vazia (org legada sem backfill), mostra um empty-state com botão "Criar
  colunas padrão".

## Hooks — `use-kitchen.tsx` (pedidos)

Espelha `use-sales.tsx` (usa `orpc` + TanStack Query):

```ts
const POLL_MS = 5000;

export function useQueryKitchenOrders() {
  // uma query só com todos os pedidos ativos; o board agrupa por columnId no cliente
  return useQuery(
    orpc.kitchen.list.queryOptions({ refetchInterval: POLL_MS }), // polling: substitui websockets
  );
}

export function useMutationCreateKitchenOrder() { /* orpc.kitchen.create + toast + invalidate */ }
export function useMutationMoveKitchenOrder()   { /* orpc.kitchen.move   + invalidate kitchen.list */ }
```

- **Uma query** com todos os pedidos da org; o board agrupa por `columnId`. (Como o número de
  colunas é variável, uma query-por-coluna fica frágil — preferimos uma lista única + agrupamento
  no cliente. Mantém o polling simples e a invalidação única.)
- Nas mutations, `onSuccess`: `toast.success(...)` + `queryClient.invalidateQueries` da chave de
  `kitchen.list`.
- **Update otimista (recomendado)**: em `onMutate`, mover o card da coluna de origem para a de
  destino imediatamente (e rollback em `onError`, ex.: estourou WIP). Como o arraste já
  reposiciona o card visualmente, o otimismo evita um "pisca" até o próximo refetch/polling.

## Hooks — `use-kitchen-columns.tsx` (colunas)

```ts
export function useQueryKitchenColumns(includeInactive = false) {
  return useQuery(orpc.kitchen.columns.list.queryOptions({ input: { includeInactive } }));
}
export function useMutationCreateColumn()  { /* columns.create  + toast + invalidate */ }
export function useMutationUpdateColumn()  { /* columns.update  + toast + invalidate */ }
export function useMutationDeleteColumn()  { /* columns.delete  + toast + invalidate (trata BAD_REQUEST: coluna com cards) */ }
export function useMutationReorderColumns(){ /* columns.reorder + invalidate */ }
```

- O board usa `includeInactive = false` (só ativas); a tela de gestão usa `true` (mostra também
  as escondidas).
- Invalidação: mexer em colunas invalida `kitchen.columns.list` **e** `kitchen.list` (o
  agrupamento depende das colunas).

## Drag-and-drop — `use-kanban-dnd.ts`

Encapsula o estado e a transição do `DndContext` (agora genérica, baseada em `columnId`):

```ts
export function useKanbanDnd(columns: KitchenColumn[]) {
  const [activeId, setActiveId] = useState<string | null>(null); // p/ o DragOverlay
  const move = useMutationMoveKitchenOrder();

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const from = event.active.data.current?.columnId;                 // coluna de origem
    const to = event.over?.data.current?.columnId ?? event.over?.id;  // coluna de destino
    if (!from || !to || from === to) return;                          // mesma coluna ⇒ snap back

    // (opcional) bloqueio de WIP no cliente p/ feedback imediato:
    const dest = columns.find((c) => c.id === to);
    // if (dest?.wipLimit != null && countIn(to) >= dest.wipLimit) { toast.error("Coluna cheia"); return; }

    move.mutate({ id: event.active.id as string, toColumnId: to as string });
  }

  return { activeId, setActiveId, onDragEnd };
}
```

- **Transições livres**: qualquer `from → to` (≠) dispara `move`. O servidor é a fonte de
  verdade do limite WIP; o cliente pode antecipar o bloqueio só para UX. Drops na mesma coluna
  voltam ao lugar (snap back).

## Componentes (reutilizam shadcn de `src/components/ui/`)

`card`, `badge`, `button`, `input`, `select`, `scroll-area`, `form`, `label`, `dialog` (gestão de
colunas), `switch`/`checkbox` (flags), e um color picker simples (`input type="color"` ou paleta).

### `register-order-form.tsx`
- `react-hook-form` + `zod` (`@hookform/resolvers`, já é dependência).
- Campos: **Mesa** (`Input`), **Prato** (`Input` texto livre), **Produto (opcional)**
  (`Select`/combobox reusando a query de produtos existente — ao escolher preenche `productId`
  e sugere `estimatedMinutes`), **Minutos estimados (opcional)** (`Input` numérico).
- Submit → `useMutationCreateKitchenOrder` (sem `columnId` ⇒ cai na coluna `isInitial`). Ao
  salvar com sucesso, limpa o formulário; o pedido aparece automaticamente na coluna de entrada
  (pela invalidação/polling).

### `order-card.tsx`  (sortable / draggable)
- `useSortable({ id: order.id, data: { columnId: order.columnId } })` do `@dnd-kit/sortable`;
  aplica `transform`/`transition` via `@dnd-kit/utilities` (`CSS.Transform.toString(transform)`).
- `Card` no estilo iFood: título **"Mesa {tableNumber} · {dishName}"**.
- **Handle de arraste** (ícone grip `⠿`) com `{...attributes} {...listeners}` — só o handle
  inicia o arraste, para não conflitar com cliques/scroll.
- Badge de **tempo decorrido** (a partir de `columnEnteredAt`) + **tempo estimado** (detalhado
  na Etapa 4).
- **Botão de avançar (fallback)** — caminho não-arraste: move o card para a **próxima coluna por
  `position`** (chama `move({ id, toColumnId: próxima.id })`). Em colunas `isFinal` (sem
  próxima), o botão não aparece. O rótulo usa o nome da próxima coluna: `[→ {próxima.name}]`.

### `kitchen-column.tsx`  (droppable)
- `useDroppable({ id: column.id, data: { columnId: column.id } })` do `@dnd-kit/core`.
- `SortableContext` (`verticalListSortingStrategy`) envolvendo os `order-card` da coluna.
- `ScrollArea` com **cabeçalho dinâmico**: ícone + `column.name`, com a **cor de identificação**
  (`column.color`) aplicada à borda/faixa do cabeçalho, e `Badge` de contagem —
  `{n}` ou `{n}/{wipLimit}` quando há limite (vira destaque/vermelho ao estourar).
- Realça a área quando um card está sobre ela (`isOver`) — feedback de drop estilo iFood.
- (Opcional) ação rápida no cabeçalho (⋯) abrindo o editor daquela coluna (`column-form`).

### `column-manager.tsx` + `column-form.tsx`  (gestão de colunas)
- Aberto por um botão **"Gerenciar colunas"** no cabeçalho do board (dialog/sheet).
- Lista todas as colunas (`includeInactive: true`) com **drag-and-drop para reordenar**
  (`@dnd-kit` + `reorder`), e para cada coluna: editar / esconder (toggle `isActive`) / apagar.
- `column-form` (criar/editar) com campos: **Nome**, **Cor** (color picker), **Ícone**
  (opcional), **Descrição** (opcional), **Limite WIP** (numérico opcional), **Visível**
  (`isActive`), e flags **Coluna de entrada** (`isInitial`, única), **Mostrar na TV**
  (`showOnTv`), **Terminal** (`isFinal`).
- Erros do backend viram toast: apagar coluna com cards ou a única coluna de entrada →
  `BAD_REQUEST` (Etapa 2).

### `kitchen-board.tsx`  (DndContext)
- `PageHeader` (reusar `@/components/page-header`) + `register-order-form` + botões
  **"Gerenciar colunas"** e **"Abrir painel da TV"** + **grid de colunas dinâmicas**.
- Busca colunas (`useQueryKitchenColumns`) e pedidos (`useQueryKitchenOrders`); **agrupa os
  pedidos por `columnId`** e renderiza um `kitchen-column` por coluna ativa, na ordem de
  `position`. Grid responsivo (ex.: `flex` com scroll horizontal ou
  `grid-cols-[repeat(auto-fit,minmax(260px,1fr))]`), empilhando no mobile — **não** assume 3.
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
2. **Colunas padrão**: a org já mostra as 3 colunas (Em Preparo / Prontos / Entregues) com
   cores e ícones — sem nenhuma ação manual.
3. Cadastrar "Mesa 18 - Batata Recheada" → aparece na coluna de entrada (**Em Preparo**) sem
   recarregar.
4. **Arrastar** o card entre colunas (qualquer direção) → chama `kitchen.move`.
5. **Fallback por botão**: `[→ {próxima coluna}]` avança o card sem arrastar; some na coluna
   terminal.
6. **Personalizar**: em "Gerenciar colunas", renomear "Prontos" → "Pronto p/ Retirada", trocar a
   cor, reordenar, definir um **limite WIP** numa coluna e adicionar uma coluna nova ("Na Brasa").
   O board reflete na hora (invalidação).
7. **WIP**: encher a coluna com limite → arrastar mais um card é bloqueado (toast "Coluna cheia"
   / `BAD_REQUEST`).
8. **Apagar coluna**: com cards dentro → erro pedindo para mover antes; vazia → apaga.
9. Abrir em duas abas → mudanças refletem em ~5s (polling) na outra aba.
10. **Acessibilidade**: focar um card via teclado, espaço para "pegar", setas para mover,
    espaço para soltar.
