# Etapa 5 — Painel da TV (público, tela cheia)

> [← Etapa 4](./kds-etapa-4-tempos-preparo.md) · Próxima: [Etapa 6 — Navegação e papéis](./kds-etapa-6-navegacao-papeis.md)

## Por que

O salão precisa de uma TV mostrando **apenas os pedidos prontos para retirada**. Por ser uma
TV de parede / Chromecast, a tela deve ser **pública** (sem login), em **tela cheia** e **sem o
menu do dashboard**. Resolvemos a organização pelo `orgSlug` na URL — mesmo modelo de confiança
do storefront/checkout público.

## Arquivos afetados (novos)

- `src/app/(kitchen-display)/layout.tsx` — layout mínimo, fora do chrome de `(main)`
- `src/app/(kitchen-display)/painel/[orgSlug]/page.tsx` — página da TV
- `src/features/kitchen/components/tv-display.tsx` — componente client de exibição

## Route group `(kitchen-display)`

Um novo route group com **layout próprio**, separado de `(main)` (que injeta sidebar/header).
Isso garante a tela cheia sem o chrome do dashboard.

```tsx
// src/app/(kitchen-display)/layout.tsx
export default function KitchenDisplayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {children}
    </div>
  );
}
```

## Página — `painel/[orgSlug]/page.tsx`

- Lê `orgSlug` dos params e renderiza `<TvDisplay orgSlug={orgSlug} />` (client component).
- Sem `requireAuth` — rota pública.

## Componente — `tv-display.tsx`

```tsx
"use client";
const POLL_MS = 5000;

export function TvDisplay({ orgSlug }: { orgSlug: string }) {
  const { data } = useQuery(
    orpc.kitchen.publicReady.queryOptions({
      input: { orgSlug },
      refetchInterval: POLL_MS,
    }),
  );
  // ...
}
```

Layout conforme a especificação:

```
┌───────────────────────────────────────────────┐
│            🍻 {orgName}                          │   ← header (nome dinâmico via API)
│      PEDIDOS PRONTOS PARA RETIRADA              │
├───────────────────────────────────────────────┤
│   Mesa 18 - Batata Recheada                     │   ← grid auto-fit, tipografia grande
│   Mesa 12 - Pastel                              │
│   Mesa 07 - Torresmo                            │
│   Mesa 25 - Calabresa Acebolada                 │
├───────────────────────────────────────────────┤
│   Acompanhe sua mesa no painel.                 │   ← rodapé fixo
│   Retire no balcão ou solicite a um garçom.     │
└───────────────────────────────────────────────┘
```

Detalhes:
- **Header**: `🍻 {data.orgName}` (nome vem da API, **não** hardcoded) +
  "PEDIDOS PRONTOS PARA RETIRADA".
- **Corpo**: grid responsivo auto-fit (`grid` com `minmax`) de cards grandes "Mesa X - Prato",
  fontes grandes legíveis à distância.
- **Rodapé fixo**: "Acompanhe sua mesa no painel. Retire no balcão ou solicite a um garçom."

## Auto-sumiço

A rota `publicReady` (Etapa 2) lê os pedidos nas colunas marcadas como **`showOnTv`** e filtra
`columnEnteredAt >= now - AUTO_HIDE_MS` (Etapa 4), então pedidos prontos antigos **somem
sozinhos** da TV (~5 min), mesmo que ninguém marque como entregue. Mover o card na cozinha para
qualquer coluna **sem `showOnTv`** (ex.: a coluna terminal "Entregues") remove da TV
imediatamente.

> **Coluna da TV é configurável**: por padrão a coluna "Prontos" (criada na org) tem
> `showOnTv: true`. O usuário pode marcar outra(s) coluna(s) como exibida(s) na TV em
> "Gerenciar colunas" (Etapa 3).

## Segurança / privacidade

A rota expõe **número da mesa + nome do prato** publicamente por `orgSlug`. É aceitável para
uma TV dentro do estabelecimento (decisão confirmada). Não há dados sensíveis (sem valores,
clientes ou pagamentos). A rota só lê pedidos recentes em colunas `showOnTv` daquela org.

## Como validar a etapa

1. Mover um pedido para a coluna **showOnTv** (por padrão "Prontos") na cozinha.
2. Abrir `/painel/{orgSlug}` em **aba anônima** (sem sessão) → o pedido aparece com
   `🍻 {nome da org}` e o rodapé fixo.
3. Aguardar o polling (~5s) após mover outro pedido para a coluna da TV → ele aparece sozinho.
4. Mover o card para uma coluna **sem `showOnTv`** (ex.: "Entregues"), por arraste ou pelo botão
   `[→ {próxima coluna}]` (ou esperar `AUTO_HIDE_MS`) → some da TV.
5. `/painel/{slug-de-outra-org}` não mostra pedidos desta org (isolamento multi-tenant).
6. `/painel/slug-inexistente` → erro tratado (NOT_FOUND).
