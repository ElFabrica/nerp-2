# Etapa 6 — Navegação e Sidebar

## Objetivo

Adicionar o Catálogo Promocional ao menu lateral do admin e configurar o roteamento das páginas.

---

## Sidebar

O projeto usa `src/components/ui/sidebar.tsx` do shadcn. Localizar o arquivo de configuração de navegação do painel admin.

Arquivo provável: `src/components/app-sidebar.tsx` ou similar (verificar durante implementação).

Adicionar item:

```typescript
{
  title: "Catálogo Promocional",
  url: `/${orgSlug}/catalogo-promocional`,
  icon: Tag,        // lucide-react
}
```

Agrupar com outros itens de "Produtos" ou criar grupo "Marketing" se fizer mais sentido visualmente.

---

## Estrutura de rotas

```
src/app/(main)/[orgSlug]/catalogo-promocional/
  page.tsx           → CatalogList component
  [catalogId]/
    page.tsx         → CatalogEditor component (carrega catálogo pelo id)
```

### `page.tsx` (listagem)

```typescript
import { CatalogList } from "@/features/promotional-catalog/catalog-list";

export default function Page() {
  return <CatalogList />;
}
```

### `[catalogId]/page.tsx` (editor)

```typescript
import { CatalogEditor } from "@/features/promotional-catalog/catalog-editor";

export default function Page({ params }: { params: { catalogId: string } }) {
  return <CatalogEditor catalogId={params.catalogId} />;
}
```

O editor carrega o catálogo via TanStack Query (`useQuery`) usando o id da rota.

---

## Breadcrumb

Seguir o padrão já existente no projeto para breadcrumb no header:

- Na listagem: `Catálogo Promocional`
- No editor: `Catálogo Promocional > [Nome do Catálogo]`

O nome do catálogo no breadcrumb do editor deve ser editável inline (click → input).

---

## Proteção de rota

As rotas `(main)` já são protegidas pelo layout pai com verificação de autenticação e organização ativa. Não é necessário middleware adicional.

---

## Verificação

- Menu lateral exibe "Catálogo Promocional" com ícone Tag
- Clicar no item navega para a listagem
- Breadcrumb aparece corretamente em ambas as páginas
- Botão "← Catálogos" no editor navega de volta para a listagem
- Acessar `/[orgSlug]/catalogo-promocional/id-inexistente` → tratar 404 graciosamente (redirect ou página de erro)
