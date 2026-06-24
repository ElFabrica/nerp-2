# Catálogo Promocional — Visão Geral

## O que é

Uma ferramenta no painel admin para criar, configurar e exportar catálogos visuais de produtos em promoção. O resultado é um PDF ou PNG pronto para divulgar em WhatsApp, Instagram, email, etc.

## Fluxo do usuário

1. Admin acessa **Catálogo Promocional** no menu lateral
2. Vê a lista de catálogos salvos (ou lista vazia no primeiro acesso)
3. Clica em **Novo Catálogo** → nomeia e entra no editor
4. No editor, configura visual, filtra produtos, vê o preview em tempo real
5. Salva e/ou exporta como PNG ou PDF

## Etapas de implementação

| Etapa | Arquivo | Conteúdo |
|-------|---------|----------|
| 1 | `01-banco-de-dados.md` | Schema Prisma + migration |
| 2 | `02-api-routes.md` | Rotas oRPC (CRUD do catálogo + filtro de produtos) |
| 3 | `03-listagem.md` | Página de listagem de catálogos salvos |
| 4 | `04-editor.md` | Editor com painel de config + preview ao vivo |
| 5 | `05-exportacao.md` | Exportação PNG e PDF (html-to-image + jspdf) |
| 6 | `06-navegacao.md` | Sidebar + roteamento |

## Stack utilizada

- **Next.js 15** App Router, **React 19**, **TypeScript**
- **Prisma** (novo model `PromotionalCatalog`) + **PostgreSQL**
- **oRPC** para as API routes (padrão do projeto)
- **shadcn/ui** + **Tailwind 4** para UI
- **TanStack Query** para data fetching
- **html-to-image** + **jspdf** para exportação (a instalar)

## Conceito chave: campo `promotionalPrice`

O produto já possui `promotionalPrice Decimal?` no banco. Todos os produtos com esse campo preenchido são elegíveis para o catálogo. O sistema calcula o desconto como:

```
desconto% = ((salePrice - promotionalPrice) / salePrice) * 100
economia  = salePrice - promotionalPrice
```
