# ERP Limas

Sistema de Gestão Empresarial (ERP) moderno e eficiente, desenvolvido com as tecnologias mais recentes do ecossistema web.

## 🚀 Tecnologias Utilizadas

### Core

- **[Next.js 15](https://nextjs.org/)**: Framework React com suporte a App Router e Server Components.
- **[React 19](https://react.dev/)**: Biblioteca principal para construção da interface.
- **[Typescript](https://www.typescriptlang.org/)**: Tipagem estática para maior segurança e produtividade.

### Estilização e UI

- **[Tailwind CSS 4](https://tailwindcss.com/)**: Framework CSS utilitário para design rápido e responsivo.
- **[Radix UI](https://www.radix-ui.com/)** & **[Shadcn/UI](https://ui.shadcn.com/)**: Componentes acessíveis e altamente customizáveis.
- **[Lucide React](https://lucide.dev/)**: Conjunto de ícones minimalistas e consistentes.

### Backend e Dados

- **[oRPC](https://orpc.dev/)**: Framework para APIs tipadas de ponta a ponta.
- **[Prisma](https://www.prisma.io/)**: ORM moderno para interação segura com o banco de dados.
- **[PostgreSQL](https://www.postgresql.org/)**: Banco de dados relacional robusto.
- **[TanStack Query v5](https://tanstack.com/query/latest)**: Gerenciamento de estado assíncrono e cache de dados.

### Autenticação e Segurança

- **[Better Auth](https://better-auth.com/)**: Solução de autenticação moderna e flexível.
- **[Zod](https://zod.dev/)**: Validação de esquemas e dados.

### Ferramentas de Desenvolvimento

- **[Biome](https://biomejs.dev/)**: Ferramenta rápida para linting e formatação de código.
- **[pnpm](https://pnpm.io/)**: Gerenciador de pacotes eficiente.
- **[Docker](https://www.docker.com/)**: Containerização para ambiente de desenvolvimento local (Banco de Dados).

### Outras Integrações

- **Stripe**: Processamento de pagamentos.
- **Asaas**: Integração de gateway de pagamento brasileiro.
- **AWS S3 / Storage**: Armazenamento e upload de arquivos.
- **TipTap**: Editor de texto rico (WYSIWYG).
- **Zustand**: Gerenciamento de estado global leve.

---

## 🛠️ Configuração e Instalação

Siga os passos abaixo para rodar o projeto localmente.

### Pré-requisitos

- Node.js (v20 ou superior)
- pnpm instalado
- Docker e Docker Compose

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/erp-limas.git
cd erp-limas
```

### 2. Instalar Dependências

```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Auth
BETTER_AUTH_SECRET=seu_secret_aqui
BETTER_AUTH_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://docker:docker@localhost:5432/erp-limas"

# Google Auth (Opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Domains
NEXT_PUBLIC_BASE_DOMAIN=localhost:3000
NEXT_PUBLIC_DOMAIN=http://localhost:3000

# Upload AWS / S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_ENDPOINT_URL_S3=
AWS_REGION=auto
AWS_BUCKET_NAME=
NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Asaas
ASSAS_API_KEY=
ASSAS_API_URL=https://api-sandbox.asaas.com/v3
ASSAS_ACCESS_TOKEN=
```

### 4. Subir o Banco de Dados (Docker)

Este projeto utiliza Docker para subir a instância do PostgreSQL.

```bash
docker compose up -d
```

### 5. Executar as Migrações do Prisma

```bash
pnpm db:migrate
pnpm db:generate
```

### 6. Rodar o Servidor de Desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📜 Scripts Disponíveis

- `pnpm dev`: Inicia o servidor de desenvolvimento com Turbopack.
- `pnpm build`: Gera a build de produção (gera Prisma client, roda migrações e build do Next.js).
- `pnpm lint`: Executa o Biome para verificar erros de linting.
- `pnpm format`: Formata o código usando o Biome.
- `pnpm db:generate`: Gera os tipos do Prisma Client.
- `pnpm db:migrate`: Executa as migrações do banco de dados.
- `pnpm db:studio`: Abre o Prisma Studio para visualizar o banco de dados.
- `pnpm db:seed`: Popula o banco de dados com dados iniciais.
