# Etapa 4 — Editor de Catálogo

## Objetivo

Página de edição com dois painéis: configuração (esquerda) e preview ao vivo (direita). Todas as mudanças de configuração refletem no preview instantaneamente. O config é salvo no banco via debounce ou botão explícito.

---

## Rota

```
/[orgSlug]/catalogo-promocional/[catalogId]
```

Arquivo: `src/app/(main)/[orgSlug]/catalogo-promocional/[catalogId]/page.tsx`

---

## Layout geral

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Catálogos   |   "Promoções de Julho"   |  [Salvar]  [↓ Exportar] │
├─────────────────────┬────────────────────────────────────────────────┤
│  CONFIGURAÇÃO       │           PREVIEW                              │
│                     │                                                │
│  [Título]           │  ┌────────────────────────────────────────┐   │
│  [Subtítulo]        │  │         PROMOÇÕES DE JULHO             │   │
│                     │  │  ┌──────┐ ┌──────┐ ┌──────┐           │   │
│  Layout: ○ ○ ○ ○    │  │  │prod1 │ │prod2 │ │prod3 │           │   │
│  Estilo: card       │  │  │      │ │      │ │      │           │   │
│  Ordenação: ▼       │  │  │ -35% │ │ -20% │ │ -50% │           │   │
│  Tema: ○ ○ ○        │  │  └──────┘ └──────┘ └──────┘           │   │
│                     │  │  ┌──────┐ ┌──────┐                    │   │
│  [+] Exibir opções  │  │  │prod4 │ │prod5 │                    │   │
│                     │  │  └──────┘ └──────┘                    │   │
│  PRODUTOS (5/12)    │  └────────────────────────────────────────┘   │
│  [buscar produto]   │                                                │
│  ✓ Produto A  [x]   │                                                │
│  ✓ Produto B  [x]   │                                                │
│  + Adicionar        │                                                │
└─────────────────────┴────────────────────────────────────────────────┘
```

---

## Componente principal

`src/features/promotional-catalog/catalog-editor.tsx`

State local: `CatalogConfig` (inicializado com os dados do banco, nunca nulo).

```typescript
const [config, setConfig] = useState<CatalogConfig>(loadedConfig);
// Toda mudança em config -> debounce 800ms -> updateCatalog({ id, config })
```

---

## Painel esquerdo: `config-panel.tsx`

Seções:

### 1. Identidade
- Input: **Título** (obrigatório)
- Input: **Subtítulo** (opcional)

### 2. Aparência
- **Layout**: botões visuais com ícone representativo de cada modelo:
  - Grid 2 colunas (`grid-2`)
  - Grid 3 colunas (`grid-3`)
  - Grid 4 colunas (`grid-4`)
  - Lista (`list`)
  - Destaque + Grid (`featured`)
  - Carrossel (`carousel`)
  - Masonry (`masonry`)
  - Tabela (`table`)
- **Estilo do card**: Select com as opções:
  - Compacto (`compact`)
  - Padrão (`standard`)
  - Lista (`list`)
  - Com Countdown (`countdown`) — habilita campo de data de expiração
  - Badge Destaque (`badge-hot`)
  - Minimalista (`minimal`)
- **Tema**: 3 swatches coloridos (Claro / Escuro / Vibrante)

### 3. Ordenação
- Select:
  - Maior desconto %
  - Maior economia (R$)
  - Menor preço
  - Maior preço
  - Nome A-Z

### 4. Campos visíveis (Collapsible "Exibir opções")
- Toggle: Descrição
- Toggle: Categoria
- Toggle: Estoque
- Toggle: SKU

### 5. Produtos
- Filtro por categoria (multi-select)
- Lista dos produtos ativos no catálogo (com badge de desconto)
- Botão `[x]` para excluir produto individualmente
- Input de busca para adicionar produto extra (não promocional)
- Contador: "X produtos incluídos"

---

## Painel direito: `catalog-preview.tsx`

- `ref={previewRef}` — este elemento é capturado na exportação
- Renderiza os produtos em tempo real conforme o `config`
- Aplica o tema (classes CSS diferentes por tema)
- Mostra título, subtítulo, grid/lista de cards

### Temas implementados via classe no div raiz:

```typescript
const themeClass = {
  light: "bg-white text-gray-900",
  dark: "bg-slate-900 text-white",
  vibrant: "bg-primary text-white",
}[config.theme];
```

---

## Variantes de card

### `card-compact.tsx`
- Imagem quadrada pequena (80px)
- Nome (1 linha, truncado)
- Badge "-XX%"
- Preço promocional em destaque

### `card-standard.tsx`
- Imagem (full width, aspect-square)
- Nome (2 linhas max)
- Preço original riscado + preço promocional grande
- Badge "-XX%" + "Economize R$ XX"
- Opcionalmente: categoria, descrição curta

### `card-list.tsx`
- Layout horizontal: [imagem 80px] [nome + preços + badge]
- Ideal para listas longas

### `card-countdown.tsx`
- Igual ao `card-standard`, mas com temporizador regressivo abaixo do preço
- Recebe `expiresAt: Date` via prop (passado pelo catálogo)
- Contador: `HH:MM:SS` atualizado a cada segundo via `setInterval`

```
┌─────────────────────┐
│  ████████████████   │
│  Nome do Produto    │
│  ┌──────┐           │
│  │ -35% │  R$ 64,90 │
│  └──────┘  R$ 99,90 │
│  ⏱ Termina em 02:14:37 │
└─────────────────────┘
```

### `card-badge-hot.tsx`
- Igual ao `card-standard`, mas exibe faixa "MAIS VENDIDO" ou "NOVO" no canto superior
- Badge configurado por produto (campo `highlight` no modelo)

```
┌─────────────────────┐
│ ╔═══════════════╗   │
│ ║ MAIS VENDIDO  ║   │  ← faixa diagonal
│  ████████████████   │
│  Nome do Produto    │
│  ┌──────┐           │
│  │ -35% │  R$ 64,90 │
│  └──────┘  R$ 99,90 │
└─────────────────────┘
```

### `card-minimal.tsx`
- Apenas imagem + nome + preço promocional com badge
- Sem preço original, sem descrição
- Útil para catálogos impressos / exportação em PDF

```
┌─────────────────────┐
│  ████████████████   │
│  Nome do Produto    │
│  R$ 64,90  ┌────┐   │
│            │-35%│   │
│            └────┘   │
└─────────────────────┘
```

---

## Modelos de visualização (layouts)

### Layout: Grid Padrão (2/3/4 colunas)

Já documentado acima. Ideal para catálogos gerais.

---

### Layout: Destaque + Grid

Um produto em evidência ocupa a primeira linha inteira; os demais preenchem o grid abaixo.

```
┌────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────┐  │
│  │              PRODUTO EM DESTAQUE              │  │
│  │  [imagem larga]    Nome · -50% · R$ 49,90    │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │ p2   │  │ p3   │  │ p4   │  │ p5   │           │
│  └──────┘  └──────┘  └──────┘  └──────┘           │
└────────────────────────────────────────────────────┘
```

Config: `layout: "featured"` — o primeiro produto da lista (maior desconto por padrão) ganha o slot de destaque.

---

### Layout: Carrossel

Produtos exibidos em linha horizontal com scroll ou navegação por setas. Útil para telas de TV e quiosques.

```
┌────────────────────────────────────────────────────┐
│         PROMOÇÕES DE JULHO                         │
│                                                    │
│  ◀  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ▶   │
│     │ p1   │  │ p2   │  │ p3   │  │ p4   │       │
│     │ -35% │  │ -20% │  │ -50% │  │ -15% │       │
│     └──────┘  └──────┘  └──────┘  └──────┘       │
│         ● ○ ○ ○  (indicador de página)            │
└────────────────────────────────────────────────────┘
```

Config: `layout: "carousel"` — número de cards visíveis calculado pelo container (padrão 4).

---

### Layout: Masonry

Cards com alturas variáveis para acomodar descrições longas sem espaço vazio.

```
┌────────────────────────────────────────────────────┐
│  ┌──────┐  ┌──────┐  ┌──────┐                     │
│  │ p1   │  │ p2   │  │ p3   │                     │
│  │      │  │      │  │(alto)│                     │
│  │      │  └──────┘  │      │                     │
│  └──────┘  ┌──────┐  │      │                     │
│  ┌──────┐  │ p4   │  └──────┘                     │
│  │(alto)│  │      │  ┌──────┐                     │
│  │ p5   │  └──────┘  │ p6   │                     │
│  └──────┘             └──────┘                    │
└────────────────────────────────────────────────────┘
```

Config: `layout: "masonry"` — implementado com CSS `columns` ou biblioteca `react-masonry-css`.

---

### Layout: Tabela comparativa

Produtos como linhas de tabela com colunas de atributos. Ideal para comparação de preços entre variantes.

```
┌───────────────────────────────────────────────────────┐
│  Produto          │ Categoria │ Original  │ Promo │ %  │
├───────────────────┼───────────┼───────────┼───────┼────┤
│  [img] Produto A  │ Bebidas   │ R$ 99,90  │ 64,90 │-35%│
│  [img] Produto B  │ Laticínio │ R$ 45,00  │ 36,00 │-20%│
│  [img] Produto C  │ Padaria   │ R$ 12,00  │  6,00 │-50%│
└───────────────────┴───────────┴───────────┴───────┴────┘
```

Config: `layout: "table"` — colunas visíveis controladas pelos toggles de "Campos visíveis".

---

## Destaque de preço (todos os cards)

```
┌─────────────────────┐
│  ████████████████   │  ← imagem
│  Nome do Produto    │
│  ┌──────┐           │
│  │ -35% │  R$ 64,90 │  ← badge + preço promocional grande
│  └──────┘  R$ 99,90 │  ← preço original riscado
│  Economize R$ 35,00 │  ← economia
└─────────────────────┘
```

---

## Auto-save

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    updateCatalog({ id: catalogId, config });
  }, 800);
  return () => clearTimeout(timer);
}, [config]);
```

Indicador discreto: "Salvando..." / "Salvo" no header.

---

## Verificação

- Abrir editor → produtos com `promotionalPrice` aparecem automaticamente
- Mudar layout → preview atualiza sem reload
- Mudar tema → cores do preview mudam
- Remover produto → some do preview imediatamente
- Adicionar produto não-promocional via busca → aparece no preview
- Aguardar 1s sem interação → indicador "Salvando..." → "Salvo"
- Recarregar página → configurações preservadas
