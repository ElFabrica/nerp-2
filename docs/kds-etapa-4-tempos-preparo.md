# Etapa 4 — Tempos de preparo diferentes (decorrido / atraso)

> [← Etapa 3](./kds-etapa-3-tela-cozinha.md) · Próxima: [Etapa 5 — Painel da TV](./kds-etapa-5-painel-tv.md)

## Por que

É o **requisito-chave** do projeto: pratos têm tempos de preparo diferentes. O kanban não pode
ser uma fila FIFO — cada pedido precisa mostrar **quanto tempo já passou**, **quanto era
esperado** e **destacar visualmente os atrasados**, para a cozinha priorizar. Toda a matemática
de tempo roda **no cliente** (a partir de `createdAt`/`estimatedMinutes` serializados),
atualizando a cada segundo sem ida ao servidor.

## Arquivos afetados (novos)

- `src/utils/kitchen-config.ts`
- `src/hooks/use-elapsed.ts`
- Integração nos cards: `src/features/kitchen/components/order-card.tsx` (da Etapa 3)

## `src/utils/kitchen-config.ts`

Mesma forma de `src/utils/status-sales-config.ts` (config central + helper):

```ts
export const DEFAULT_PREP_MINUTES = 15;          // fallback quando estimatedMinutes é null
export const AUTO_HIDE_MS = 5 * 60 * 1000;       // pedido pronto some da TV após ~5 min

export type Urgency = "normal" | "warning" | "overdue";

export function getOrderUrgency(
  createdAtIso: string,
  estimatedMinutes: number | null,
  now: number,
): Urgency {
  const est = (estimatedMinutes ?? DEFAULT_PREP_MINUTES) * 60_000;
  const elapsed = now - new Date(createdAtIso).getTime();
  if (elapsed < est) return "normal";
  if (elapsed < est * 1.5) return "warning";
  return "overdue";
}

export const urgencyStyles: Record<Urgency, { badge: string; border: string; label: string }> = {
  normal:  { badge: "bg-secondary text-secondary-foreground", border: "border-border",          label: "No prazo" },
  warning: { badge: "bg-amber-500 text-white",                 border: "border-amber-500",       label: "Atenção" },
  overdue: { badge: "bg-destructive text-destructive-foreground", border: "border-destructive animate-pulse", label: "Atrasado" },
};
```

## `src/hooks/use-elapsed.ts`

Hook que recalcula o "agora" a cada segundo (clock tick) para o tempo decorrido ficar fluido:

```ts
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function formatElapsed(createdAtIso: string, now: number) {
  const ms = Math.max(0, now - new Date(createdAtIso).getTime());
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;   // mm:ss
}
```

## Integração no `order-card.tsx`

```tsx
const now = useNow();
const urgency = getOrderUrgency(order.createdAt, order.estimatedMinutes, now);
const style = urgencyStyles[urgency];

// <Card className={cn("border-2", style.border)}>
//   Mesa {order.tableNumber} - {order.dishName}
//   <Badge className={style.badge}>{formatElapsed(order.createdAt, now)}</Badge>
//   <span>~{order.estimatedMinutes ?? DEFAULT_PREP_MINUTES} min</span>
```

## Regras

- **Faixas de urgência**: `elapsed < est` → normal; `est ≤ elapsed < est*1.5` → warning (âmbar);
  `elapsed ≥ est*1.5` → overdue (vermelho + pulse). Alternadas via `cn()`.
- **Ordenação**: a coluna de entrada (**Em Preparo**) vem do backend ordenada por `position`
  (mais antigo primeiro, já que entra no fim) → os mais atrasados ficam no topo.
- **Tempo decorrido**: calculado a partir de `columnEnteredAt` (tempo na coluna atual). Para o
  "tempo total desde o cadastro", use `createdAt`.
- **Polling x clock**: o conjunto de pedidos atualiza a cada 5s (Etapa 3); o relógio
  recalcula o decorrido a cada 1s — o número sobe suave entre os refetches.
- **Janela `AUTO_HIDE_MS`**: usada pela rota `public-ready` (Etapa 2/5) para esconder da TV
  pedidos antigos em colunas `showOnTv`, **e também pelo `list.ts`** (Etapa 2) para limitar as
  colunas **`isFinal`** do kanban `/cozinha` aos itens recentes (via `columnEnteredAt`) — uma
  única constante rege as duas superfícies.

## Como validar a etapa

1. Cadastrar um pedido com `estimatedMinutes` pequeno (ex.: 1 min).
2. O badge de tempo sobe a cada segundo.
3. Ao passar de 1 min → card fica âmbar; ao passar de 1,5 min → fica vermelho com pulse.
4. Sem `estimatedMinutes` e sem produto vinculado → usa `DEFAULT_PREP_MINUTES` (15 min).
