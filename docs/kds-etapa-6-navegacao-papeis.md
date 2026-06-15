# Etapa 6 — Navegação, papéis e refinamentos

> [← Etapa 5](./kds-etapa-5-painel-tv.md) · [Visão geral](./kds-visao-geral.md)

## Por que

Fechar o fluxo: tornar a Cozinha acessível pelo menu, definir a política de acesso e validar a
qualidade (lint, teste ponta a ponta).

## Arquivos afetados

- `src/components/app-sidebar.tsx` (modificar)
- Revisão geral das etapas anteriores

## Navegação / sidebar

Adicionar a entrada da Cozinha ao array de navegação de `src/components/app-sidebar.tsx`
(ex.: após "Frente de caixa"):

```ts
import { ChefHat } from "lucide-react";

{ name: "Cozinha", href: "/cozinha", icon: ChefHat }
```

- A rota `/painel/[orgSlug]` **não** entra na sidebar — é pública e de tela cheia.
- O acesso à TV é feito pelo botão **"Abrir painel da TV"** dentro de `/cozinha` (Etapa 3),
  que abre `/painel/{orgSlug}` em nova aba.

## Papéis (RBAC)

- `Member.role` é um campo string livre (default `"member"`) e o app atual **não** aplica RBAC
  nas rotas oRPC existentes.
- **Decisão**: o KDS segue o mesmo comportamento — **qualquer membro autenticado da org** pode
  registrar/avançar pedidos. Não introduzimos gate por papel nesta entrega (mantém consistência
  com o restante do app).
- **Futuro (opcional)**: se quiserem restringir a cozinha, dá para checar
  `context.org.members` no middleware das rotas `kitchen.*` e liberar só para papéis específicos
  (ex.: `"kitchen"`, `"manager"`, `"owner"`).

## Refinamentos finais

- Garantir invalidação correta das queries após `markReady`/`markDelivered` (Etapa 3).
- Conferir responsividade da `/cozinha` (colunas empilham no mobile).
- Conferir legibilidade da TV à distância (tamanho de fonte, contraste no fundo escuro).
- `npm run lint` (Biome) sem erros; `npm run format` se necessário.

## Como validar (teste ponta a ponta completo)

1. `npm run db:migrate` e `npm run db:generate` sem erro.
2. `npm run dev`, logar, ver **"Cozinha"** na sidebar → abrir `/cozinha`.
3. Cadastrar "Mesa 18 - Batata Recheada" → entra em **Em Preparo**, tempo subindo.
4. Passar do tempo estimado → card âmbar → vermelho (atrasado).
5. **Arrastar** o card de Em Preparo → **Prontos** (ou botão `[→ Pronto]`).
6. Botão **"Abrir painel da TV"** → `/painel/{orgSlug}` em nova aba, sem login, mostra o pronto
   com `🍻 {nome da org}` e o rodapé; atualiza sozinho (~5s).
7. **Arrastar** de Prontos → **Entregues** (ou `[→ Entregue]`) → some da TV; aparece na coluna
   **Entregues** e some dela após `AUTO_HIDE_MS`.
8. Isolamento multi-tenant entre orgs diferentes.
9. `npm run lint` sem erros.
