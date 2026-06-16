import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
import { enqueueSyncOutbox } from "./sync-outbox";
import { crossLoginPlugin } from "./cross-login-plugin";
// If your Prisma file is located elsewhere, you can change the path

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 20,
    requireEmailVerification: false,
  },
  // ── Sync de auth NERP → NASA (best-effort) ──────────────────────────
  // Os hooks só GRAVAM na SyncOutbox (fire-and-forget); um processador
  // (endpoint/cron) entrega ao NASA com retry/backoff. Tudo via Prisma cru
  // do lado de lá, então não há eco.
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await enqueueSyncOutbox("user", {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image ?? null,
            phone: null,
            createdAt: new Date(user.createdAt).toISOString(),
            updatedAt: new Date(user.updatedAt).toISOString(),
          });
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          await enqueueSyncOutbox("account", {
            id: account.id,
            accountId: account.accountId,
            providerId: account.providerId,
            userId: account.userId,
            accessToken: account.accessToken ?? null,
            refreshToken: account.refreshToken ?? null,
            idToken: account.idToken ?? null,
            accessTokenExpiresAt: account.accessTokenExpiresAt
              ? new Date(account.accessTokenExpiresAt).toISOString()
              : null,
            refreshTokenExpiresAt: account.refreshTokenExpiresAt
              ? new Date(account.refreshTokenExpiresAt).toISOString()
              : null,
            scope: account.scope ?? null,
            password: account.password ?? null,
            createdAt: new Date(account.createdAt).toISOString(),
            updatedAt: new Date(account.updatedAt).toISOString(),
          });
        },
      },
    },
  },
  plugins: [
    organization({
      organizationHooks: {
        afterCreateOrganization: async ({ organization, member }) => {
          await prisma.organization.update({
            where: {
              id: organization.id,
            },
            data: {
              subdomain: organization.slug,
            },
          });
          // Semeia o kanban da cozinha estilo iFood (3 colunas padrão editáveis).
          await prisma.kitchenColumn.createMany({
            data: [
              {
                organizationId: organization.id,
                name: "Em Preparo",
                color: "#F97316",
                position: 0,
                isInitial: true,
                icon: "ChefHat",
              },
              {
                organizationId: organization.id,
                name: "Prontos",
                color: "#22C55E",
                position: 1,
                showOnTv: true,
                icon: "BellRing",
              },
              {
                organizationId: organization.id,
                name: "Entregues",
                color: "#64748B",
                position: 2,
                isFinal: true,
                icon: "CheckCheck",
              },
            ],
          });
          // Replica org + member do owner no NASA.
          await enqueueSyncOutbox("org", {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logo: organization.logo ?? null,
            metadata:
              typeof organization.metadata === "string"
                ? organization.metadata
                : organization.metadata
                  ? JSON.stringify(organization.metadata)
                  : null,
            createdAt: new Date(organization.createdAt).toISOString(),
          });
          if (member?.id) {
            await enqueueSyncOutbox("member", {
              id: member.id,
              organizationId: member.organizationId,
              userId: member.userId,
              role: member.role,
              createdAt: new Date(member.createdAt).toISOString(),
            });
          }
        },
        afterAddMember: async ({ member }) => {
          await enqueueSyncOutbox("member", {
            id: member.id,
            organizationId: member.organizationId,
            userId: member.userId,
            role: member.role,
            createdAt: new Date(member.createdAt).toISOString(),
          });
        },
      },
    }),
    crossLoginPlugin(),
  ],
});
