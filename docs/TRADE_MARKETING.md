# Módulo Trade Marketing — Documentação e Handoff

> Documento vivo para continuar a implementação em outras sessões.
> Última atualização: entrega das etapas **M1–M4**.

---

## 1. Objetivo do módulo

Adicionar ao NERP (`erp-limas`) um módulo de **Trade Marketing** para a distribuidora
(a `Organization` da conta). Três partes conectadas:

1. **Editor de mapa da loja (planta baixa 2D)** — o usuário **desenha** paredes,
   corredores, gôndolas, ilhas, caixas, etc., **ou importa** uma planta como fundo.
   Cada objeto é independente. Arquitetado para **evoluir para 3D** sem reescrever dados.
2. **Fotos do PDV** — cada ponto promocional (objeto do mapa) acumula fotos por visita,
   formando histórico visual, com metadados e filtros.
3. **Book em PDF** — relatório fotográfico personalizado (capa + páginas) que puxa as
   fotos do PDV, para enviar à indústria (ex.: Nestlé).

### Decisões de arquitetura já tomadas (aprovadas)
- **Motor do editor 2D:** React-Konva (integração React; Transformer para
  arrastar/redimensionar/rotacionar; caminho coerente para React Three Fiber no 3D).
- **Planta baixa:** desenhar do zero **e** importar imagem/PDF como fundo (com escala em metros).
- **Fotos ↔ mapa:** anexadas ao **objeto do mapa** (gôndola/ilha), com **fallback** direto na loja quando ainda não há mapa.
- **PDF:** geração **server-side** (`@react-pdf/renderer`) como job Inngest, salvo em R2.
- **Indústria/Marcas:** reutilizar `Supplier` como "Indústria" (já tem `logo`) + tabela `Brand` (marcas com logo).

---

## 2. Stack (contexto do repo)

- Next.js 15 (App Router) · React 19.1 · TypeScript · Tailwind v4 + shadcn/ui
- Prisma 7 / PostgreSQL · client gerado em `src/generated/prisma` (importe de `@/generated/prisma/client` e enums de `@/generated/prisma/enums`)
- API via **oRPC** (`src/app/router/**`, client em `src/lib/orpc.ts`) + **TanStack Query**
- **Better Auth** com plugin de organização (multi-tenant via `Organization`/`Member`)
- **Zustand** (estado do editor) · **Cloudflare R2** (uploads via presigned URL)
- Lint/format: **Biome** (`pnpm biome check` / `--write`)
- Jobs em background: **Inngest** (`pnpm inngest:dev`)

> ⚠️ **Isolamento multi-tenant é feito na aplicação (não há RLS no Postgres).**
> Todo handler novo DEVE filtrar por `context.org.id`.

---

## 3. Modelo de dados (Prisma)

Adicionados em `prisma/schema.prisma` (todos org-scoped: `organizationId` + relação cascade + `@@index` + `@@map`).

| Model | Papel |
|---|---|
| `Store` | Loja / Cliente-PDV (`name`, `code`, `managerName` = Gerente da loja, endereço) |
| `FloorPlan` | Planta/mapa de uma loja (`widthM`, `heightM`, `pixelsPerMeter`, `backgroundImageKey`, `backgroundTransform`, `defaultViewport`) |
| `MapLayer` | Camada (Estrutura, Gôndolas, Promoções, Empresas, Elétrica, Hidráulica, Auditorias) — `visible`, `locked`, `order` |
| `MapObject` | Objeto do mapa (gôndola/parede/etc.). **`geometry` em metros**, `heightM` p/ 3D futuro, `style`, `supplierId`, `brandId`, painel lateral (`name/status/category/responsibleName/lastVisitAt/properties`) |
| `Brand` | Marca da indústria (`supplierId`, `name`, `logo`) → logos no Book |
| `PdvPhoto` | Foto/visita do PDV (`storeId`, `mapObjectId?`, `section`, `responsibleCompany`, `coordinatorName`, `consultantName`, `code`, **`actionValue Decimal?`** = valor R$ da ação, `photos String[]`, `capturedAt`) |
| `Book` | Book (**`supplierId?`**=Indústria opcional — sem = book geral de ações, `distributorLogo`, `periodMonth/Year`, `status`, `pdfKey`, `generatedAt`) |
| `BookItem` | Junção Book ↔ PdvPhoto (`order`) |
| `MapAnnotation` | Pin/comentário/alerta/pendência (extra, ainda não usado na UI) |

Enums: `MapObjectType` (WALL, AISLE, SECTOR, GONDOLA, ISLAND, CHECKOUT, ENTRANCE, EXIT, DEPOSIT, RESTRICTED_AREA, PIN, TEXT), `MapShapeKind` (RECT, POLYGON, POLYLINE, POINT), `MapAnnotationType`, `BookStatus` (DRAFT|GENERATING|READY|FAILED).

Relações adicionadas em `Organization`, `Supplier` (atua como Indústria) e `User`.

### Diagrama
```mermaid
erDiagram
    Organization ||--o{ Store : ""
    Store ||--o{ FloorPlan : ""
    FloorPlan ||--o{ MapLayer : ""
    FloorPlan ||--o{ MapObject : ""
    MapLayer ||--o{ MapObject : ""
    Supplier ||--o{ Brand : "marcas"
    Supplier ||--o{ MapObject : "ocupa"
    MapObject ||--o{ PdvPhoto : "histórico"
    Store ||--o{ PdvPhoto : "fallback"
    Supplier ||--o{ Book : "indústria"
    Book ||--o{ BookItem : ""
    PdvPhoto ||--o{ BookItem : ""
```

### ✅ Migrações aplicadas
As migrações do módulo **já foram geradas e aplicadas** (banco `nerp-db` @ `localhost:5433`):
`add_trade_marketing_module` (tabelas base) e `book_action_value_optional_supplier`
(`PdvPhoto.actionValue` + `Book.supplierId` opcional). `prisma migrate status` = up to date.
Rodar `pnpm db:generate` após pull para atualizar o client em `src/generated/prisma`.

---

## 4. Arquitetura do editor (engine-agnóstico → 3D)

Princípio: **o domínio (dados em metros) é independente do motor gráfico.**

- **Domínio:** models Prisma + tipos em `src/features/store-map/engine/types.ts` (`SceneObject`, `Geometry`, `SceneLayer`, `FloorPlanMeta`, `Viewport`).
- **Aplicação:** `engine/scene-store.ts` — store **Zustand** com objetos/camadas/seleção/viewport, **undo/redo**, e **fila de persistência** (`dirtyIds`/`newIds`/`deletedIds` → `consumeDirty()`).
- **Render:** `renderers/konva/` (2D atual). Um futuro `renderers/three/` consome o **mesmo** `SceneModel`/`geometry` e extruda por `heightM`.

Coordenadas: geometria em **metros**; o Stage do Konva usa `scale = zoom * pixelsPerMeter` e `x/y = viewport`, então os shapes são desenhados direto em metros (`strokeScaleEnabled=false` mantém traço em px).

Persistência: edições marcam objetos "sujos" → autosave **debounced (800ms)** via `mapObject.bulkUpsert`/`bulkDelete` (hook `use-floor-plan-scene.ts`). Ids gerados no cliente (uuid) para upsert idempotente.

---

## 5. API (oRPC) — routers novos

Registrados em `src/app/router/index.ts`. Todos escopados por `context.org.id`.

- `store/` — `create`, `list`, `getOne`, `update`, `delete`
- `brand/` — `create`, `list` (por `supplierId`), `update`, `delete`
- `floorPlan/` — `create` (cria camadas padrão), `list`, `getFull` (hidrata o editor), `update`, `delete`
- `mapLayer/` — `create`, `update`, `delete`, `reorder`
- `mapObject/` — `bulkUpsert`, `bulkDelete`
  - `bulkUpsert` só faz `update` de ids já pertencentes ao mapa (evita sobrescrever id de outra org); valida `layerId`.

---

## 6. Estrutura de pastas (o que já existe)

```
src/app/router/{store,brand,floor-plan,map-layer,map-object,pdv-photo,book}/   # oRPC
src/app/(main)/(rest)/lojas/page.tsx                            # lista de lojas
src/app/(main)/(rest)/lojas/[storeId]/mapa/page.tsx             # editor
src/app/(main)/(rest)/books/page.tsx                            # lista de books
src/app/(main)/(rest)/books/[bookId]/page.tsx                   # editor do book
src/features/books/  components/ | hooks/ | pdf/ | server/ | lib/  # Book PDF (M8)
src/features/stores/            # CRUD de lojas (hooks + componentes)
src/features/brands/            # marcas (hook + BrandsManager embutido no fornecedor)
src/features/store-map/
  engine/        types.ts | geometry.ts | scene-store.ts | tools.ts
  hooks/         use-floor-plans.ts | use-map-layers.ts | use-floor-plan-scene.ts
  renderers/konva/  map-stage.tsx | shape-node.tsx | map-grid.tsx | map-background.tsx
  components/    map-editor.tsx | editor-toolbar.tsx | layers-panel.tsx
                 object-properties-panel.tsx | store-map-workspace.tsx | new-floor-plan-dialog.tsx
```

Permissões: chaves `lojas` e `books` em `src/lib/permissions.ts` + itens no `src/components/app-sidebar.tsx`.
Deps adicionadas: `konva@9`, `react-konva@19.0.10`, `use-image` (fixadas para React 19.1).

---

## 7. Status por etapa (roadmap)

| Etapa | Descrição | Status |
|---|---|---|
| **M1** | Schema + enums + permissões + sidebar + `prisma generate` | ✅ código pronto · ⚠️ **migração pendente** |
| **M2** | Store + Brand (routers, hooks, UI, BrandsManager) | ✅ completo |
| **M3** | Engine (types, geometry, scene-store) + routers floorPlan/mapLayer/mapObject | ✅ completo |
| **M4** | Editor React-Konva (zoom/pan, grid, snap, desenhar, Transformer, multi-seleção, camadas, autosave, painel básico) | ✅ completo |
| **M5** | Import de planta (imagem de fundo) + **calibração de escala** (2 cliques → medida real reescala o `backgroundTransform`) + opacidade + leitura de coordenadas em metros | ✅ completo (régua com ticks fica p/ M9) |
| **M6** | Painel lateral: vincular **Indústria (Supplier)** e **Marca (Brand)** + seção **Fotos do PDV** | ✅ completo |
| **M7** | **Fotos do PDV**: `MultiPhotoUploader`, router `pdvPhoto/` (create/list filtrado/update/delete/`filterOptions`), histórico por objeto, página `/lojas/[storeId]` (fallback na loja) | ✅ completo |
| **M8** | **Book em PDF** server-side + UI | ✅ completo (backend + UI) |
| **M9** | Extras: minimapa, snapping/guias, culling de viewport, anotações (`MapAnnotation`), dashboard (contagens), refinos | ⏳ pendente |

---

## 8. Próximos passos detalhados (para retomar)

> **M5–M8 concluídos.** Próximo: **M9 (extras)**.
>
> Feito no editor: `background-controls.tsx`, `scale-calibration-dialog.tsx`, overlays de coordenadas/calibração
> (`map-stage.tsx`); painel com Indústria/Marca (`object-properties-panel.tsx`).
> Fotos do PDV em `src/features/pdv-photos/` (`multi-photo-uploader`, `pdv-photo-dialog`, `pdv-photo-history`,
> `pdv-photo-section`, hook `use-pdv-photos`) + router `src/app/router/pdv-photo/` + página `/lojas/[storeId]`.
> Helper compartilhado de upload: `src/lib/upload-to-r2.ts`.

### M8 — Book em PDF (server-side + UI) — ✅ CONCLUÍDO

**✅ Backend + geração (typecheck/biome limpos, commitados):**
- Dep `@react-pdf/renderer@4.5.1` instalada.
- Template PDF `src/features/books/pdf/book-document.tsx` (capa: logo distribuidora=`Organization.logo` ou `Book.distributorLogo` + logo indústria=`Supplier.logo` + nome + "Mês / Ano"; páginas: metadados + grade de fotos + logos das marcas no rodapé).
- Renderer server `src/features/books/server/generate-book.tsx` (`generateBook(bookId)`): carrega book+itens+fotos+supplier+brands+org, `renderToBuffer`, `uploadBufferToR2`, marca `pdfKey/READY`.
- Util server `src/lib/upload-buffer-to-r2.ts` (`PutObjectCommand`).
- Inngest: evento `book/generate.requested` (`src/lib/inngest/client.ts`) + função `bookGenerate` (`src/lib/inngest/functions.ts`, registrada no array `functions`).
- Router `src/app/router/book/` (registrado como `book` em `router/index.ts`): `create, list, getOne` (inclui itens), `update, delete, importPhotos` ({bookId, pdvPhotoIds[]}), `removeItem` ({bookId, pdvPhotoId}), `generate` (seta GENERATING + `inngest.send(bookGenerateRequested.create({bookId}))`).
- Hooks `src/features/books/hooks/use-books.ts`: `useBooks`, `useBook(id)` (polling a cada 2.5s enquanto `status==="GENERATING"`), `useCreateBook`, `useDeleteBook`, `useImportBookPhotos`, `useRemoveBookItem`, `useGenerateBook`.

**✅ UI (entregue nesta sessão — `src/features/books/components/` + rotas):**
1. `add-book-button.tsx` + `create-book-dialog.tsx` — nome, Indústria (`useSupplier`), mês (Select 1–12) + ano; `useCreateBook` → redireciona para `/books/[id]`.
2. `books-list.tsx` (+ `delete-book-dialog.tsx`, `book-status-badge.tsx`) — tabela de books com status, período, indústria, nº de fotos; ações: abrir, baixar PDF quando READY (`constructUrl(pdfKey)`), excluir.
3. Rota `src/app/(main)/(rest)/books/page.tsx` (server) — `requirePermission("books")` + `PageHeader` + `AddBookButton` + `BooksList`.
4. `book-editor.tsx` + rota `src/app/(main)/(rest)/books/[bookId]/page.tsx` (server, `requirePermission("books")`, `await params`): `useBook(id)` (polling enquanto GENERATING); cabeçalho com dados/status, grade de fotos com remover (`useRemoveBookItem`), botão **Gerar PDF** (`useGenerateBook`) + download quando READY.
5. `import-photos-dialog.tsx` — filtros por Indústria (default = indústria do book) e Seção (`usePdvFilterOptions` + `usePdvPhotos`), lista de capturas candidatas com checkbox (exclui já importadas), "Importar (n)" → `useImportBookPhotos({ bookId, pdvPhotoIds })`.
6. Helper `src/features/books/lib/book-format.ts` (`formatPeriod`, `formatBRL`, `BOOK_STATUS_META`).

**✅ Ajuste ao book real do cliente (baseado no PPT "BOOK AÇÕES … VAREJO 2026"):**
- Template `book-document.tsx` **reescrito** para o formato do cliente: **16:9** (960×540pt), **uma página por ação/PDV** com faixa colorida (nome da loja) + coluna de dados (Gerente / Coordenador / Consultor / Empresa PDV / Seção / Código / **VALOR destacado**) + fotos grandes (layout adapta a 1/2/3–4 fotos); capa com logo da distribuidora (+ logo da indústria se houver); página de fecho "Obrigado!".
- **`PdvPhoto.actionValue`** (Decimal): campo **Valor (R$)** no `pdv-photo-dialog`, exibido no histórico e na grade do editor do book (`formatBRL`).
- **`Book.supplierId` opcional**: `create-book-dialog` permite "Nenhuma (book geral de ações)"; lista/editor mostram "Geral". `generate-book` e a capa lidam com indústria ausente.
- Migração `book_action_value_optional_supplier` aplicada (drop NOT NULL em `books.supplierId` + `actionValue` em `pdv_photos`).

### M9 — Extras (depois do M8)
- Minimapa, régua com ticks (hoje há só leitura de coordenadas), snapping/guias de alinhamento.
- Culling de viewport (renderizar só objetos visíveis) + índice espacial para mapas grandes.
- Anotações no mapa (`MapAnnotation` já existe no schema): pins/comentários/alertas/pendências.
- Dashboard com contagens (lojas, PDVs, books, pendências).
- Reordenar itens do Book (drag) e reordenar camadas por drag; edição de captura do PDV (update).

---

## 9. Convenções (padrão em todas as etapas)

- **Tipagem estrita — proibido `any`** (usar tipos gerados do Prisma, `z.infer`, tipos do `SceneModel`).
- **Código limpo e legível, sem comentários supérfluos** (comentar só o "porquê" não óbvio).
- **Reuso**: aproveitar uploaders existentes, `constructUrl` (`src/hooks/use-construct-url.ts`), padrão de hooks de `src/features/supplier/hooks/use-supplier.ts`, primitivos shadcn/ui.
- **Multi-tenant**: todo handler filtra por `context.org.id`.
- Rodar `pnpm biome check --write` nos arquivos novos e `npx tsc --noEmit` antes de fechar cada etapa.

---

## 10. Como rodar / verificar

```bash
# 1. Subir o Postgres (porta 5435 conforme .env) e aplicar a migração
pnpm db:migrate --name add_trade_marketing_module

# 2. App + Inngest (necessário para M8)
pnpm dev
pnpm inngest:dev

# 3. Fluxo de teste (após M5+):
#  - Criar Loja em /lojas → abrir Mapa → importar planta + calibrar escala
#  - Desenhar gôndolas/ilhas; arrastar/redimensionar/rotacionar; alternar camadas; recarregar (persistiu?)
#  - Clicar na gôndola → vincular Indústria+Marca, subir Fotos do PDV
#  - Criar Book (indústria + mês/ano) → Importar fotos (filtros) → Gerar → baixar PDF
```

---

## 11. Pendências / notas conhecidas

- ✅ **Migrações aplicadas** (ver §3) — banco em sync.
- **Verificação parcial:** rotas compilam e exigem `requirePermission`; RPC do book carrega igual aos routers existentes; PDF renderizado num smoke-test (capa + páginas + fecho, sem erro de layout). **Falta** o click-through autenticado (criar → importar → gerar via Inngest → baixar) e a conferência visual do PDF com fotos/logos reais.
- **Bug pré-existente (fora do escopo):** `src/app/router/supplier/update.ts` e `delete.ts` não escopam por organização (vazamento cross-tenant). Registrado à parte; os handlers novos deste módulo escopam corretamente.
- **Nota:** chamada RPC não-autenticada devolve **500** (não 401) — comportamento app-wide do middleware de auth, não específico do módulo.
- Git `origin` foi trocado para HTTPS nesta máquina (SSH indisponível). Para voltar: `git remote set-url origin git@github.com:ElFabrica/nerp-2.git`.
- PR aberta: **#8** — `feat/trade-marketing-map-pdv-book`.
