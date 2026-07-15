# Trade Marketing — Área de Visualização do Mapa (PDV em Campo)

> Proposta de nova funcionalidade para o módulo de Trade Marketing do NERP.
> Documento de apresentação — foco no problema, valor e escopo de entrega.

---

## 1. O problema

Hoje o módulo de Trade Marketing possui apenas o **editor de planta baixa** — a tela onde a
loja é desenhada e configurada (paredes, corredores, gôndolas, ilhas). É uma tela pesada, cheia
de ferramentas de desenho, pensada para **montar** o mapa.

Só que a operação do dia a dia é outra: o **consultor/promotor em campo** não quer desenhar nada.
Ele precisa **abrir o mapa já pronto**, achar rapidamente a gôndola negociada, **conferir/atualizar
as informações da negociação** e **registrar as fotos do PDV** daquela visita.

Sem uma tela dedicada a isso, o uso em campo fica confuso e sujeito a erros (risco de mexer no
desenho do mapa sem querer, dificuldade de achar o ponto certo, etc.).

---

## 2. A solução

Criar uma **Área de Visualização do Mapa**: uma tela limpa, por loja, onde o usuário logado
**vê somente o mapa configurado** e interage com ele:

- **Clica** em qualquer elemento (gôndola, ilha, caixa…) e **edita as informações** dele.
- **Dá zoom e navega** no mapa para selecionar o ponto com precisão.
- **Busca** por uma gôndola/elemento pelo nome — ao escolher, o item **fica em destaque**,
  o mapa **centraliza** nele e o painel de edição abre.
- **Anexa fotos do PDV** (gôndola, produto, código) diretamente no elemento.

É exatamente o fluxo das telas de referência apresentadas (versão desktop e mobile).

### Como a tela se comporta

| Ação do usuário | Resultado |
|---|---|
| Abre a loja | O mapa já configurado aparece enquadrado na tela |
| Rola o scroll / usa os botões +/− | Zoom no mapa |
| Arrasta o mapa | Navega (pan) pela planta |
| Busca "Gôndola Bebidas" | O item é destacado, centralizado e o painel abre |
| Clica numa gôndola | Abre o card "Informações da Prateleira" para editar |
| Tira/anexa fotos | As fotos ficam no histórico daquele ponto do PDV |

---

## 3. O painel de informações (ao clicar num elemento)

Card no estilo **"Informações da Prateleira"**. Os campos se dividem em dois grupos: os que o
promotor **preenche/edita** e os que o sistema **captura automaticamente** (para rastreabilidade).

### 3.1. Preenchidos/editados pelo promotor

- **Supermercado** (loja)
- **Localização** (Corredor / Seção / Lado)
- **Tipo de espaço** (ex.: Gôndola negociada)
- **Marca ocupante** e **Indústria**
- **Distribuidor / Representante**
- **Categoria** (ex.: Refrigerantes)
- **Período da negociação** (início → fim)
- **Status** (Ativo / Pendente)
- **Fotos do PDV** (com histórico por visita)

Todos **editáveis na hora**, com **salvamento automático**.

### 3.2. Capturados automaticamente (rastreabilidade — o promotor não digita)

- **Última visita** — data/hora atualizada sozinha sempre que o promotor edita o elemento ou
  anexa uma foto naquele ponto.
- **Promotor responsável** — o **usuário logado** que fez a edição/foto é registrado
  automaticamente (quem mexeu e quando).
- **Supervisor** — **não é digitado no elemento**. Vem do **cadastro do promotor** (relação):
  cada promotor tem um supervisor definido uma única vez, e o mapa/relatórios apenas **puxam**
  esse dado. Assim não há retrabalho nem risco de digitar errado a cada visita.

> **Por que isso importa:** dá **rastreabilidade** completa — para cada ponto do PDV sabemos
> *quem* foi a última pessoa em campo, *quando* esteve lá e *qual supervisor* responde por ela,
> sem depender do promotor preencher nada manualmente.

---

## 4. Requisitos atendidos

**Funcionais**
- ✅ Editar as informações do elemento clicado.
- ✅ Zoom no mapa para facilitar a seleção.
- ✅ Buscar por gôndola/elemento e destacá-lo para edição.
- ✅ Adicionar fotos do PDV ao elemento.
- ✅ Registrar automaticamente **última visita**, **promotor responsável** e **supervisor**
  (este último puxado do cadastro, sem redigitar).

**Não funcionais**
- ✅ **Responsivo** — funciona em desktop e celular (no mobile o painel abre como uma gaveta).
- ✅ **Intuitivo** — tela limpa, sem as ferramentas de desenho do editor.

---

## 5. Diferencial de arquitetura (baixo custo, baixo risco)

A funcionalidade **reaproveita quase tudo** que já foi construído no módulo:

- O mesmo mecanismo de dados e **salvamento automático** já existente.
- Os mesmos componentes de **mapa, fotos do PDV, indústrias e marcas**.
- Os **campos de negociação** usam um campo flexível que já existe — **sem mudança de banco**.
- A **última visita** já tem campo próprio no elemento — só passa a ser preenchida sozinha.

Os campos de **rastreabilidade do promotor** exigem um **ajuste pequeno e pontual**:
- Registrar no elemento **quem** foi o último a editar (o usuário logado).
- Incluir no **cadastro do promotor** o campo **Supervisor** (uma relação, definida uma vez).
Nada disso mexe no editor atual, que continua **intacto**.

Ou seja: entregamos uma tela nova de alto valor para o campo **sem retrabalho relevante** e
**sem risco** de quebrar o que já existe.

---

## 6. Escopo da entrega

**Incluído nesta fase**
- Nova tela de visualização por loja (acesso a partir da lista de lojas).
- Zoom, navegação e enquadramento automático do mapa.
- Busca por nome com destaque + centralização do elemento.
- Painel de informações completo (dados atuais + negociação) com edição e autosave.
- **Rastreabilidade automática:** última visita, promotor responsável e supervisor (via cadastro).
- Campo **Supervisor** no cadastro do promotor (definido uma vez, reaproveitado no mapa/relatórios).
- Fotos do PDV por elemento.
- Layout responsivo (desktop + mobile).

**Fase seguinte (v2 — evolução)**
- Filtro por seção e **coluna de logos de marca** (clicar na marca destaca as gôndolas dela),
  como nas telas de referência.
- Minimapa e otimizações para plantas muito grandes.

---

## 7. Resumo executivo

Uma tela **feita para o campo**: o promotor abre o mapa pronto, acha a gôndola, atualiza a
negociação e registra as fotos — de forma rápida, intuitiva e em qualquer dispositivo, com
**rastreabilidade automática** de quem esteve no PDV, quando, e sob qual supervisor.
Alto valor operacional, **reaproveitando** a base já entregue, com **ajuste mínimo no banco** e
**sem risco** para o editor existente.
