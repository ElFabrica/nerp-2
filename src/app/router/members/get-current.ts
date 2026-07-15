import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import z from "zod";

// Retorna o Member do usuário logado para a org ativa. Usado pelo cliente para
// filtrar a sidebar e por server-side guards. Owner/Admin não dependem de
// permissions[] — sempre veem tudo.
export const getCurrentMember = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "GET",
    summary: "Membership do usuário logado na org ativa",
    tags: ["members"],
  })
  .input(z.object({}))
  .output(
    z
      .object({
        id: z.string(),
        role: z.string(),
        permissions: z.array(z.string()),
      })
      .nullable(),
  )
  .handler(async ({ context }) => {
    const member = await prisma.member.findFirst({
      where: {
        organizationId: context.org.id,
        userId: context.user.id,
      },
      select: { id: true, role: true, permissions: true },
    });

    if (!member) return null;

    return {
      id: member.id,
      role: member.role,
      permissions: member.permissions ?? [],
    };
  });
