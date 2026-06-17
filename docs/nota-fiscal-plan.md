# Plano: Emissão de Nota Fiscal (NFC-e / NF-e / NFS-e) no NERP-2

> Documento de planejamento da funcionalidade de emissão de documentos fiscais.
> Stack: Next.js 15 + Prisma/PostgreSQL + ORPC + Better Auth (multi-tenant por `Organization`).

## Contexto

O sistema é um ERP SaaS multi-tenant. Hoje existem dois caminhos de venda:

1. **Frente de caixa (PDV)** — `/vendas/novo` → `createSale` (`src/app/router/sales/create.ts`), venda manual no balcão.
2. **Checkout online** — storefront → Asaas (`purchase-assas.ts`) ou Stripe → webhook (`api/assas/webhooks`, `api/stripe/webhooks`) cria a `Sale`.

O problema: **nenhuma venda gera documento fiscal**. A `Sale` já tem o campo `invoiceNumber` (nunca preenchido) e o `payment-dialog.tsx` já mostra o checkbox **"Gerar Nota Fiscal (NF-e)"** (sem backend). Faltam todos os dados fiscais:

- `Product` não tem NCM/CFOP/CST/origem.
- `Organization` tem CNPJ (`document`) mas não tem regime tributário, Inscrição Estadual nem CSC.
- `Sale` não tem chave/protocolo/status fiscal.
- O Asaas no projeto só cria cobrança (PIX/cartão), **não emite nota**.

**Objetivo:** tornar as vendas transparentes e legais, emitindo o documento fiscal correto a partir do PDV e do checkout online:

- **NFC-e (modelo 65)** — consumidor no balcão (B2C).
- **NF-e (modelo 55)** — B2B / interestadual (cliente PJ).
- **NFS-e** — serviços.

**Decisões tomadas:** API fiscal dedicada (não Asaas, não SEFAZ direto) · os três documentos · implementação completa.

**Provedor escolhido:** **Focus NFe** como implementação concreta (suporta os 3 modelos, homologação/sandbox, emissão assíncrona com webhook e geração de DANFE/DANFCE/PDF). Toda a integração fica atrás de uma interface `FiscalProvider` para permitir trocar por PlugNotas/NFe.io sem reescrever a aplicação.

---

## Arquitetura

```
Venda (PDV ou checkout)
   └─> emitFiscalDocument({ saleId, model })   [src/lib/fiscal/emit.ts]
         ├─ carrega Sale + items + Customer + FiscalSettings da Org
         ├─ valida completude fiscal (IE, CSC, NCM/CFOP dos itens)
         ├─ decide modelo (NFC-e / NF-e / NFS-e) se não informado
         ├─ buildPayload()  [src/lib/fiscal/build-payload.ts + tax.ts]
         ├─ cria FiscalDocument (status PENDING/PROCESSING)
         └─ provider.emit*()  [src/lib/fiscal/focus-nfe.ts via index.ts]
                 ↑ resposta assíncrona
   Webhook do provedor  [src/app/api/fiscal/webhooks/route.ts]
         └─ atualiza FiscalDocument (AUTHORIZED/REJECTED) + Sale.invoiceNumber
```

A emissão assíncrona reaproveita o **Inngest** já presente no projeto (`src/lib/inngest`, `api/inngest`) para retry/polling quando o webhook não chega.

---

## 1. Modelo de dados (`prisma/schema.prisma`)

### 1.1 Novo model `FiscalSettings` (1:1 com `Organization`)
Configuração tributária do emitente, separada da `Organization` para isolar dados sensíveis:

- `regimeTributario` enum (CRT: `SIMPLES_NACIONAL` / `SIMPLES_EXCESSO` / `REGIME_NORMAL`)
- `inscricaoEstadual`, `inscricaoMunicipal`, `cnae`
- `ambiente` enum (`HOMOLOGACAO` / `PRODUCAO`)
- `provider` enum (`FOCUS_NFE`, default) · `providerToken` (criptografado) · `providerCompanyRef` (ref do emitente no provedor, por CNPJ)
- NFC-e: `cscId` (idToken) · `csc` (criptografado)
- Séries/numeração: `nfeSeries`, `nfeNextNumber`, `nfceSeries`, `nfceNextNumber` (fallback; a numeração oficial pode ser delegada ao provedor)
- Padrões: `defaultCfopInterno`, `defaultCfopInterestadual`, `serviceIssRate`, `serviceListItem`
- `enabled` Boolean · `autoEmitOnlineSale` Boolean (emitir automático no checkout online)
- relação inversa: adicionar `fiscalSettings FiscalSettings?` em `Organization`

> Certificado A1 (.pfx) **não é persistido localmente**: é enviado direto ao provedor no fluxo de configuração; guardamos apenas `providerCompanyRef`.

### 1.2 Campos fiscais em `Product`
Adicionar (todos opcionais para não quebrar produtos existentes):

- `productType` enum (`PRODUTO` default / `SERVICO`) — decide NF-e/NFC-e vs NFS-e
- `ncm`, `cest`, `cfop`, `origem` (0–8), `unidadeTributavel`
- ICMS: `cstIcms` (ou `csosn` p/ Simples), `aliquotaIcms`
- PIS/COFINS: `cstPis`, `cstCofins`, `aliquotaPis`, `aliquotaCofins`
- IPI (opcional): `cstIpi`, `aliquotaIpi`
- Serviço (NFS-e): `itemListaServico`, `aliquotaIss`

### 1.3 Snapshot fiscal em `SaleItem`
Adicionar `ncm`, `cfop`, `cstIcms`, `aliquotaIcms`, `valorIcms`, `valorPis`, `valorCofins` (preenchidos no momento da emissão — snapshot histórico).

### 1.4 Novo model `FiscalDocument`
Separado de `Sale` para permitir múltiplas tentativas, cancelamento e histórico:

- `id`, `organizationId`, `saleId` (opcional)
- `model` enum (`NFE` / `NFCE` / `NFSE`)
- `status` enum (`PENDING` / `PROCESSING` / `AUTHORIZED` / `REJECTED` / `CANCELLED` / `ERROR`)
- `ref` (nossa ref idempotente única) · `providerRef`
- `number`, `series`, `accessKey` (chave 44 díg.), `protocol`
- `environment` (`HOMOLOGACAO`/`PRODUCAO`)
- `xmlUrl`, `danfeUrl` (PDF)
- `rejectionReason`, `sefazStatus`, `sefazMessage`
- `cancellationReason`
- totais: `baseCalculoIcms`, `valorIcms`, `valorPis`, `valorCofins`, `valorTotal`
- `emittedAt`, `authorizedAt`, `cancelledAt`, `createdAt`, `updatedAt`
- relações com `Organization` e `Sale` (adicionar `fiscalDocuments FiscalDocument[]` nos dois)

> Após o schema: `pnpm prisma migrate dev --name add_fiscal` e regenerar o client (`src/generated/prisma`).

---

## 2. Camada de provedor fiscal (`src/lib/fiscal/`)

Seguir o padrão de clients existentes (`src/lib/stripe.ts`, `src/http/sync-nasa/client.ts`).

- **`provider.ts`** — interface `FiscalProvider`: `emitNfe`, `emitNfce`, `emitNfse`, `consult(ref)`, `cancel(ref, reason)`, `getDanfe(ref)`, `upsertCompany(...)` (cadastro do emitente + certificado).
- **`focus-nfe.ts`** — implementação Focus NFe (REST, header Basic auth com token). Emissão assíncrona: `POST` retorna `ref`; status final vem por webhook ou `consult`.
- **`index.ts`** — factory `getFiscalProvider(settings)` que escolhe a implementação por `settings.provider`.
- **`tax.ts`** — cálculo de impostos por CST/CSOSN (ICMS, PIS, COFINS, IPI; ISS p/ serviço), respeitando o regime (Simples usa CSOSN).
- **`build-payload.ts`** — monta o payload do provedor a partir de `Sale` + itens + `Customer` + `FiscalSettings`. Decide CFOP (interno vs interestadual comparando UF da Org e do cliente).
- **`emit.ts`** — orquestrador `emitFiscalDocument({ saleId, model? })`: valida completude fiscal, escolhe modelo (NFC-e quando consumidor/sem CNPJ; NF-e quando cliente PJ; NFS-e quando itens de serviço), cria `FiscalDocument`, chama o provider, persiste resposta. Gera `ref` idempotente a partir de `saleId+model`.
- **Segredos**: reutilizar `src/lib/nasa-s2s-crypto.ts` para criptografar `providerToken`/`csc`. Token global de conta em env (`FOCUS_NFE_TOKEN`, `FOCUS_NFE_API_URL`) + emitente por org (`providerCompanyRef`).
- **Inngest**: função `fiscal/emit` e `fiscal/poll-status` em `src/lib/inngest` para retry/backoff (padrão já usado no projeto).

---

## 3. Rotas ORPC (`src/app/router/fiscal/`)

Seguir o padrão `base.use(requireAuthMiddleware).use(requireOrgMiddleware).route(...).input(z...).output(z...).handler(...)` e registrar em `src/app/router/index.ts`.

- `settings-get.ts` / `settings-upsert.ts` — CRUD de `FiscalSettings` (+ envio do certificado/credenciais ao provedor via `upsertCompany`).
- `emit.ts` — emite documento para uma venda (chama `emitFiscalDocument`).
- `cancel.ts` — cancela documento autorizado (motivo obrigatório, mín. 15 caracteres p/ SEFAZ).
- `list.ts` / `get.ts` — listagem e detalhe de `FiscalDocument` (com URLs de XML/DANFE).

## 4. Webhook do provedor

- **`src/app/api/fiscal/webhooks/route.ts`** — recebe callback de autorização/rejeição (espelha o padrão de `api/assas/webhooks/route.ts`): valida assinatura/segredo, localiza `FiscalDocument` por `ref`/`providerRef`, atualiza `status`, `accessKey`, `protocol`, `xmlUrl`, `danfeUrl`; ao autorizar, grava `Sale.invoiceNumber` e dispara impressão do cupom quando aplicável. Sempre responder 200.

---

## 5. Integração com os fluxos existentes

- **PDV**: `payment-dialog.tsx` já entrega `generateInvoice` no `onConfirm`. Propagar pela cadeia `create-sale/index.tsx` → hook `src/features/sales/hooks/use-sales.tsx` → `createSale`. Em `src/app/router/sales/create.ts`, após criar a `Sale`, se `generateInvoice`, chamar `emitFiscalDocument` (via Inngest). Adicionar `generateInvoice` ao input do `createSale`.
- **Checkout Asaas** (`api/assas/webhooks/route.ts`, após criar a `Sale` em `CHECKOUT_PAID`) e **Stripe** (`api/stripe/webhooks/route.ts`): se `FiscalSettings.autoEmitOnlineSale`, disparar `emitFiscalDocument` (não derrubar o webhook em caso de falha — mesmo padrão do `try/catch` do `createKitchenOrdersFromSale`).

## 6. UI (`src/features/fiscal/`)

- **Configuração tributária**: nova página em `(main)` (ao lado de configurações da org) — formulário de `FiscalSettings`, upload de certificado A1, toggle homologação/produção, CSC, regime. Usar componentes `src/components/ui` + react-hook-form/zod já no projeto.
- **Produto**: adicionar seção "Dados fiscais" (NCM/CEST/CFOP/origem/CST/alíquotas, tipo produto/serviço) no formulário de produto existente em `src/features/products`.
- **Detalhe da venda** (`src/features/sales/components/sale-details.tsx`): badge de status fiscal, botão **Emitir nota**, download DANFE/XML, botão **Cancelar nota**.
- **Listagem "Notas Fiscais"**: nova página com filtros (modelo, status, período) consumindo `fiscal/list`. Adicionar item no menu (`src/components/app-sidebar.tsx`) respeitando o sistema de permissões (`src/lib/permissions.ts`).

## 7. Ambiente / segredos (`.env`)

Adicionar `FOCUS_NFE_API_URL` (homologação por padrão) e `FOCUS_NFE_TOKEN`. Token por org e CSC ficam criptografados em `FiscalSettings`.

---

## Arquivos críticos

**Novos:**
- `src/lib/fiscal/{provider,focus-nfe,index,tax,build-payload,emit}.ts`
- `src/app/router/fiscal/{settings-get,settings-upsert,emit,cancel,list,get}.ts`
- `src/app/api/fiscal/webhooks/route.ts`
- `src/features/fiscal/**`
- funções Inngest em `src/lib/inngest`

**Alterados:**
- `prisma/schema.prisma` (FiscalSettings, FiscalDocument, campos em Product/SaleItem/Sale/Organization)
- `src/app/router/index.ts`
- `src/app/router/sales/create.ts`
- `src/features/sales/hooks/use-sales.tsx`
- `src/features/sales/components/novo/create-sale/index.tsx`
- `src/features/sales/components/sale-details.tsx`
- `src/app/api/assas/webhooks/route.ts`
- `src/app/api/stripe/webhooks/route.ts`
- formulário de produto em `src/features/products`
- `src/components/app-sidebar.tsx`
- `src/lib/permissions.ts`
- `.env`

**Reaproveitar:**
- `src/lib/nasa-s2s-crypto.ts` (cripto de segredos)
- padrão Inngest existente
- padrão de webhook do Asaas
- campos já existentes `Sale.invoiceNumber`, `Customer.document/personType`, `Organization.document/address/state`, checkbox `generateInvoice` do `payment-dialog.tsx`

---

## Ordem de implementação

1. Schema fiscal + migration + regenerar client.
2. Camada `src/lib/fiscal/` (provider + Focus NFe + tax + build-payload + emit) com testes em homologação.
3. Webhook do provedor + funções Inngest.
4. Rotas ORPC (settings, emit, cancel, list, get) + registro no index.
5. UI: config tributária → campos fiscais no produto → ações na venda → listagem de notas.
6. Wire PDV (`createSale` + `generateInvoice`) e auto-emissão nos webhooks Asaas/Stripe.

---

## Funcionalidade detalhada por etapa

Descrição do que cada etapa entrega — do ponto de vista do negócio e do usuário.

### Etapa 1 — Modelo de dados fiscal
**O que passa a existir:** o sistema ganha "memória fiscal". Cada empresa (tenant) passa a ter uma configuração tributária própria (`FiscalSettings`), cada produto carrega sua classificação fiscal (NCM, CFOP, origem, CST/alíquotas) e cada nota emitida vira um registro auditável (`FiscalDocument`) com chave de acesso, protocolo, status e links de XML/PDF.
**Para o usuário:** nenhuma tela ainda, mas é a base que torna possível emitir documento legal e rastrear cada nota (emitida, rejeitada, cancelada) por venda.

### Etapa 2 — Camada de provedor fiscal (`src/lib/fiscal/`)
**O que faz:** traduz uma venda do NERP no formato fiscal e conversa com o provedor (Focus NFe). Calcula impostos conforme o regime da empresa (Simples usa CSOSN; Regime Normal usa CST), escolhe o documento certo (NFC-e p/ consumidor, NF-e p/ empresa, NFS-e p/ serviço) e o CFOP (interno vs interestadual pela UF). É idempotente — a mesma venda não gera nota duplicada.
**Para o usuário:** garante que o valor de imposto na nota bate com a venda e que a nota correta é emitida automaticamente, sem o operador precisar entender de tributação.

### Etapa 3 — Webhook do provedor + processamento assíncrono (Inngest)
**O que faz:** a emissão na SEFAZ é assíncrona; esta etapa recebe o retorno (autorizada/rejeitada), atualiza o `FiscalDocument`, grava o número da nota na venda (`Sale.invoiceNumber`) e, se a SEFAZ estiver fora do ar, tenta de novo automaticamente (retry com backoff).
**Para o usuário:** a venda nunca trava esperando a SEFAZ; a nota "aparece autorizada" sozinha em segundos, e falhas temporárias se resolvem sem intervenção.

### Etapa 4 — Rotas ORPC (settings / emit / cancel / list / get)
**O que faz:** expõe as ações fiscais à aplicação: salvar configuração tributária (e enviar o certificado ao provedor), emitir nota de uma venda, cancelar nota autorizada (com motivo), listar e detalhar notas com os links de XML/DANFE.
**Para o usuário:** são os "botões" por trás das telas — emitir, cancelar, consultar e baixar documentos.

### Etapa 5 — Interfaces (`src/features/fiscal/` + telas existentes)
**O que faz:**
- **Configuração tributária:** tela onde a empresa informa regime, Inscrição Estadual, CSC, ambiente (homologação/produção) e faz upload do certificado A1.
- **Produto:** seção "Dados fiscais" no cadastro (NCM, CFOP, origem, CST, alíquotas, produto vs serviço).
- **Venda:** na tela de detalhe, selo de status fiscal, botão "Emitir nota", download de DANFE/XML e botão "Cancelar nota".
- **Notas Fiscais:** nova listagem com filtros (modelo, status, período), respeitando permissões.
**Para o usuário:** controle visual completo — configurar uma vez, classificar produtos, e emitir/consultar/cancelar notas no dia a dia.

### Etapa 6 — Integração com os fluxos de venda (PDV e checkout online)
**O que faz:** liga o que já existe à emissão real. No PDV, o checkbox "Gerar Nota Fiscal" passa a emitir de verdade ao finalizar a venda. No checkout online (Asaas/Stripe), se a empresa ativar "emitir automaticamente", a nota sai assim que o pagamento é confirmado.
**Para o usuário:** a nota fiscal vira parte natural da venda — no balcão ou na loja online — mantendo todas as vendas transparentes e dentro da lei, sem etapa manual separada.

---

## Verificação (ponta a ponta, em HOMOLOGAÇÃO)

1. `pnpm prisma migrate dev` aplica sem erro; client regenerado.
2. Em **homologação** do Focus NFe: configurar `FiscalSettings`, cadastrar emitente + certificado de teste.
3. Cadastrar um produto com NCM/CFOP/origem/CST válidos.
4. **PDV**: criar venda no `/vendas/novo` com "Gerar Nota Fiscal" marcado → verificar `FiscalDocument` criado, webhook chega, status `AUTHORIZED`, `Sale.invoiceNumber` preenchido, DANFCE (PDF) baixável.
5. **Checkout online**: simular `CHECKOUT_PAID` do Asaas com `autoEmitOnlineSale` ligado → NF-e emitida para cliente PJ / NFC-e para consumidor.
6. **Cancelamento**: cancelar a nota com motivo → status `CANCELLED` e evento confirmado no provedor.
7. Conferir cálculo de impostos (`tax.ts`) contra o XML retornado (ICMS/PIS/COFINS conforme regime).
8. `pnpm lint` / `pnpm build` sem erros.

---

## Observações / fora de escopo

- A emissão real em **PRODUÇÃO** exige certificado A1 válido, Inscrição Estadual ativa, habilitação de NFC-e na SEFAZ do estado e CSC — passos operacionais do cliente, não de código.
- Bug pré-existente notado (não no escopo, mas vale corrigir): em `purchase-assas.ts:160` o token vai como `` `$${...}` `` (cifrão duplicado) e o webhook do Asaas não baixa estoque nem registra `StockMovement`/`paymentMethod`.
