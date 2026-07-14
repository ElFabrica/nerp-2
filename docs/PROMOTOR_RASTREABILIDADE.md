# Promotor & Rastreabilidade no PDV — Modelagem e Decisões

> Documento técnico complementar ao `PLANO_VISUALIZACAO_MAPA_TRADE.md`.
> Trata especificamente da **questão do promotor**: quem executou a tarefa em campo,
> quando, e sob qual supervisor.

---

## 1. O problema

Quando o promotor abre a Área de Visualização do Mapa e executa a tarefa (anexar fotos,
editar as informações do elemento), precisamos saber **depois**:

- **Quando** aquele ponto do PDV foi visitado pela última vez.
- **Quem** foi o promotor que executou/editou.
- **Qual supervisor** responde por aquele promotor.

O erro comum seria pedir esses três dados **ao promotor, a cada visita**. Isso é retrabalho,
gera dado inconsistente (nome digitado errado, supervisor desatualizado) e não é confiável para
auditoria — o próprio promotor poderia digitar outro nome.

## 2. Princípio adotado

> **Rastreabilidade não se digita — se captura.**

Os três dados são **derivados do sistema**, não preenchidos em formulário:

| Dado | Origem | O promotor digita? |
|---|---|---|
| **Última visita** | Carimbo de data/hora automático ao editar/fotografar | ❌ Não |
| **Promotor responsável** | O **usuário logado** na sessão | ❌ Não |
| **Supervisor** | **Relação** no cadastro do promotor (definida 1x) | ❌ Não |

---

## 3. Modelagem

### 3.1. Última visita — reusar campo existente

`MapObject.lastVisitAt DateTime?` **já existe** no schema (`prisma/schema.prisma:1420`) e hoje não
é usado pela UI. Passa a ser preenchido automaticamente.

**Sem migração.**

### 3.2. Promotor que editou — novo campo no elemento

```prisma
model MapObject {
  // ...
  lastEditedById  String?
  lastEditedBy    User?  @relation("EditedMapObjects", fields: [lastEditedById], references: [id], onDelete: SetNull)
}
```

Segue exatamente o padrão `createdById` / `createdBy` já usado em `PdvPhoto` (schema:1477) e
`Book` (schema:1513). As **fotos do PDV já registram** `PdvPhoto.createdById`, ou seja, "quem tirou
a foto" já é rastreável hoje — o que falta é "quem editou o elemento".

### 3.3. Supervisor — **relação**, não campo no elemento

Esta é a decisão-chave. O supervisor **não pertence ao elemento do mapa** — ele pertence ao
**promotor**. Guardá-lo no elemento significaria:
- redigitar/reescolher a cada visita;
- dado duplicado em centenas de gôndolas;
- ao trocar o supervisor de um promotor, teria que atualizar todos os registros antigos.

Portanto o supervisor vira uma **auto-relação em `Member`** (que já é *org-scoped*: tem
`organizationId` + `userId`, `prisma/schema.prisma:196`):

```prisma
model Member {
  // ... campos existentes
  supervisorId String?
  supervisor   Member?  @relation("MemberSupervisor", fields: [supervisorId], references: [id], onDelete: SetNull)
  supervisees  Member[] @relation("MemberSupervisor")
}
```

**Vantagens:**
- Definido **uma única vez** no cadastro do membro/promotor.
- Trocar o supervisor de um promotor reflete **imediatamente** em todo o mapa e relatórios.
- `Member` é por organização → o isolamento **multi-tenant** é preservado naturalmente
  (um supervisor sempre é um membro da mesma organização).

### 3.4. Resumo do diff de schema

| Modelo | Campo | Tipo | Migração |
|---|---|---|---|
| `MapObject` | `lastVisitAt` | `DateTime?` | ✅ já existe |
| `MapObject` | `lastEditedById` + relação `lastEditedBy` | `String?` → `User` | 🆕 sim |
| `Member` | `supervisorId` + auto-relação `supervisor`/`supervisees` | `String?` → `Member` | 🆕 sim |

Migração **pequena e aditiva** (só colunas nulas + FKs). Nenhum dado existente é afetado.

---

## 4. Como o carimbo acontece (escrita)

O ponto delicado: o **editor de planta** e o **viewer** compartilham o mesmo endpoint de
persistência (`mapObject.bulkUpsert`). Não queremos que arrastar uma gôndola no *editor* conte
como "visita de promotor".

**Regra de disparo:**

1. No **viewer**, ao editar qualquer campo do painel, o patch enviado inclui
   `lastVisitAt: new Date().toISOString()`.
2. No servidor (`src/app/router/map-object/bulk-upsert.ts`), **quando o objeto vier com `lastVisitAt`
   no input**, grava-se também `lastEditedById = context.user.id` (do contexto autenticado).

Como o **editor nunca envia `lastVisitAt`**, ele **nunca carimba** promotor/visita.
O comportamento do editor fica **inalterado**.

> ⚠️ `lastEditedById` **nunca** vem do cliente — sempre do `context.user.id`. Isso impede que
> alguém forje a autoria da edição.

---

## 5. Como o dado é lido (exibição)

Novo handler **`mapObject.getAudit`** (`src/app/router/map-object/get-audit.ts`), org-scoped:

- **Input:** `{ id }` (id do MapObject)
- **Output:** `{ lastVisitAt, lastEditedBy: { name } | null, supervisor: { name } | null }`
- **Resolução do supervisor:** a partir de `lastEditedById` (um `userId`), busca-se o
  `Member` daquela organização (`organizationId` + `userId`) e navega-se pela relação
  `supervisor → user → name`.

Este handler é chamado **só quando um elemento é selecionado** no painel — assim o payload de
hidratação do mapa (`floorPlan.getFull`) continua enxuto e o `SceneObject` não incha.

---

## 6. Onde o Supervisor é cadastrado

O campo **Supervisor** é exposto na **tela de gestão de membros/promotores** (a mesma onde hoje
se definem as permissões de página). Regras:

- O select lista **apenas membros da mesma organização**.
- Um membro **não pode ser supervisor de si mesmo**.
- O campo é **opcional** (`null` = sem supervisor definido).
- Ao remover um membro que é supervisor, os supervisionados ficam com `supervisorId = null`
  (`onDelete: SetNull`) — nada quebra.

---

## 7. Exibição no painel do PDV

No card "Informações da Prateleira", um bloco **somente leitura**, visualmente separado dos campos
editáveis:

```
Rastreabilidade
  Última visita:        14/07/2026 09:32
  Promotor responsável: João Gabriel
  Supervisor:           Maria Souza
```

- Atualizado (refetch) após salvar uma edição ou anexar foto.
- Se o elemento nunca foi visitado: "Sem visita registrada".
- Se o promotor não tem supervisor cadastrado: "Não definido".

---

## 8. Ganhos

- **Auditoria confiável** — a autoria vem da sessão, não de um campo digitável.
- **Zero retrabalho para o promotor** — ele só faz a tarefa (foto + informação); o resto é capturado.
- **Supervisor sempre correto** — uma única fonte de verdade, no cadastro do membro.
- **Base para relatórios** — "visitas por promotor", "PDVs sem visita há X dias", "cobertura por
  supervisor" passam a ser consultas diretas, sem depender de texto livre.

---

## 9. Fora de escopo (evoluções naturais)

- Dashboard de **cobertura por supervisor / promotor**.
- Alerta de **PDV sem visita** há mais de N dias (usando `lastVisitAt`).
- Histórico completo de edições (hoje guardamos apenas a **última**; um log de auditoria
  exigiria uma tabela própria de eventos).
