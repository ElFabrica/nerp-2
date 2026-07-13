# Fornecedores — Atualizações Pendentes

> Registro de melhorias identificadas na análise do CRUD de fornecedores.
> Feature: `src/features/supplier` + `src/app/router/supplier` + `src/app/(main)/(rest)/fornecedores`
> Criado em: 2026-07-13

---

## 🔴 Crítico — Isolamento entre organizações (IDOR)

Handlers de leitura/edição/exclusão buscam o fornecedor apenas pelo `id`, sem
filtrar por `organizationId`. Um usuário de uma organização consegue ler, editar
ou apagar fornecedores de outra org conhecendo o id.

- [ ] **`router/supplier/update.ts`** — não usa `requireOrgMiddleware` e faz
      `findUnique({ where: { id } })`. Adicionar o middleware e escopar por org.
- [ ] **`router/supplier/delete.ts`** — usa `requireOrgMiddleware`, mas o
      `findUnique`/`delete` é só por `id`. Escopar por `organizationId`.
- [ ] **`router/supplier/get.ts`** — `findUnique` por `id` sem checar
      `context.org.id`. Escopar por org.

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

- [ ] **Busca não funciona** (`list-suppliers.tsx`) — o `InputGroupInput`
      ("Buscar fornecedor...") não tem `value`/`onChange` nem filtragem. É
      puramente decorativo.
- [ ] **Sem paginação** — `list.ts` retorna todos os fornecedores da org de uma
      vez. Problema de performance/UX com muitos registros.
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

1. Isolamento por organização em `get`/`update`/`delete` (segurança — fazer primeiro).
2. Busca + paginação na listagem.
3. Refatoração do `SupplierForm` compartilhado.
