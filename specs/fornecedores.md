# Fornecedores — Atualizações Pendentes

> Registro de melhorias identificadas na análise do CRUD de fornecedores.
> Feature: `src/features/supplier` + `src/app/router/supplier` + `src/app/(main)/(rest)/fornecedores`
> Criado em: 2026-07-13

---

## 🔴 Crítico — Isolamento entre organizações (IDOR) — ✅ RESOLVIDO (2026-07-13)

Handlers de leitura/edição/exclusão buscam o fornecedor apenas pelo `id`, sem
filtrar por `organizationId`. Um usuário de uma organização consegue ler, editar
ou apagar fornecedores de outra org conhecendo o id.

- [x] **`router/supplier/update.ts`** — adicionado `requireOrgMiddleware` e
      lookup via `findFirst({ id, organizationId: context.org.id })`.
- [x] **`router/supplier/delete.ts`** — lookup escopado por org antes do delete.
- [x] **`router/supplier/get.ts`** — `findFirst` escopado por `context.org.id`.

Padrão de referência (já correto em `list.ts`):

```ts
const supplier = await prisma.supplier.findFirst({
  where: { id: input.id, organizationId: context.org.id },
});
if (!supplier) throw errors.NOT_FOUND({ message: "Fornecedor não encontrado" });
```

Para `update`/`delete`, usar `updateMany`/`deleteMany` com `organizationId` no
`where`, ou o guard acima antes da operação por id.

---

## 🟠 Bugs funcionais

- [x] **Busca funcional** (`list-suppliers.tsx`) — ✅ 2026-07-13. Input com
      `value`/`onChange` + debounce; busca server-side por nome/nome fantasia/
      documento/e-mail no `list.ts`.
- [x] **Paginação** — ✅ 2026-07-13. `list.ts` paginado (`page`/`pageSize` +
      `totalCount`/`totalPages`); UI com controles de página e reticências.
- [ ] **Exclusão sem proteção contra duplo clique** (`delete-supplier.tsx`) — o
      `deleteSupplier.isPending` não é usado; o botão não desabilita nem mostra
      spinner. O modal também não identifica qual fornecedor será apagado.

---

## 🟡 UX e validação

- [ ] **Logo não exibida na listagem** — o campo é capturado e o `list` já
      retorna `logo`, mas a tabela não mostra avatar.
- [ ] **Validação fraca no schema** — `email` é `z.string().optional()` (aceita
      texto inválido) e `document` não valida CPF/CNPJ. Usar `z.string().email()`
      e checagem de dígitos do documento.
- [ ] **Strings vazias em vez de `undefined`** — `defaultValues: ""` gravam `""`
      em campos opcionais. Usar `.transform(v => v || undefined)` no schema.
- [ ] **Edit sem estado de carregamento** — o `isLoading` do `useQuerySupplier`
      é ignorado; o form aparece vazio antes do `reset`.

---

## 🔵 Qualidade de código

- [ ] **`add-supplier.tsx` e `edit-supplier.tsx` ~90% duplicados** — mesmo
      schema, campos e `handleCepChange`. Extrair um `SupplierForm` compartilhado
      (~350 linhas repetidas e risco de divergência).
- [ ] **Nomenclatura inconsistente do CEP** — form usa `cep`, `create` recebe
      `cep`, mas `update` recebe `zipCode`. Padronizar.

---

## Prioridade sugerida

1. ~~Isolamento por organização em `get`/`update`/`delete`~~ ✅ feito.
2. ~~Busca + paginação na listagem~~ ✅ feito.
3. Refatoração do `SupplierForm` compartilhado (próximo).
