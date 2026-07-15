import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  buildInvitationLink,
  sendOrganizationInvitation,
} from "@/lib/email/organization-invitation";
import { isOrgAdmin } from "@/lib/org-access";
import {
  INVITABLE_ROLE_VALUES,
  PAGE_PERMISSION_KEYS,
  roleLabel,
} from "@/lib/permissions";
import { APIError } from "better-auth/api";
import z from "zod";

const validKeys = new Set(PAGE_PERMISSION_KEYS);

export const createInvitation = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Convidar um membro para a organização",
    tags: ["invitations"],
  })
  .input(
    z.object({
      email: z.email("Informe um e-mail válido"),
      role: z.enum(INVITABLE_ROLE_VALUES),
      permissions: z.array(z.string()).default([]),
    }),
  )
  .output(z.object({ id: z.string() }))
  .handler(async ({ context, input, errors }) => {
    if (!(await isOrgAdmin(context.org.id, context.user.id))) {
      throw errors.FORBIDDEN({
        message: "Apenas administradores podem convidar membros.",
      });
    }

    const email = input.email.trim().toLowerCase();

    const alreadyMember = await prisma.member.findFirst({
      where: { organizationId: context.org.id, user: { email } },
      select: { id: true },
    });

    if (alreadyMember) {
      throw errors.BAD_REQUEST({
        message: "Este e-mail já pertence a um membro da organização.",
      });
    }

    let invitationId: string;
    let expiresAt: Date;

    try {
      // `resend: true` faz o Better Auth reaproveitar/reenviar um convite
      // pendente para o mesmo e-mail em vez de estourar erro de duplicidade.
      const invitation = await auth.api.createInvitation({
        headers: context.headers,
        body: {
          email,
          role: input.role,
          organizationId: context.org.id,
          resend: true,
        },
      });
      invitationId = invitation.id;
      expiresAt = new Date(invitation.expiresAt);
    } catch (error) {
      if (error instanceof APIError) {
        throw errors.BAD_REQUEST({ message: error.message });
      }
      throw error;
    }

    // Admin enxerga tudo, então permissões por página só fazem sentido p/ member.
    const permissions =
      input.role === "member"
        ? Array.from(
            new Set(input.permissions.filter((p) => validKeys.has(p as never))),
          )
        : [];

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { permissions },
    });

    try {
      await sendOrganizationInvitation({
        to: email,
        organizationName: context.org.name,
        inviterName: context.user.name,
        inviterEmail: context.user.email,
        roleLabel: roleLabel(input.role),
        inviteLink: buildInvitationLink(invitationId),
        expiresAt,
      });
    } catch (error) {
      // O convite já existe e fica pendente na lista; o admin pode reenviar.
      throw errors.INTERNAL_SERVER_ERROR({
        message: `Convite criado, mas o e-mail não pôde ser enviado: ${
          error instanceof Error ? error.message : "erro desconhecido"
        } Use "Reenviar e-mail" na lista de convites.`,
      });
    }

    return { id: invitationId };
  });
