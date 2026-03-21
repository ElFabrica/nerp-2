import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
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
  plugins: [
    organization({
      organizationHooks: {
        afterCreateOrganization: async ({ organization }) => {
          await prisma.organization.update({
            where: {
              id: organization.id,
            },
            data: {
              subdomain: organization.slug,
            },
          });
        },
      },
    }),
  ],
});
