import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import prisma from "./db";
import {
  firstAllowedHref,
  memberHasPermission,
  type PagePermissionKey,
} from "./permissions";

export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return session;
};

// Server-side guard: bloqueia páginas admin se o member não tiver permissão.
// Owner/Admin sempre passam. Sem org ativa ou sem member → redireciona.
export const requirePermission = async (key: PagePermissionKey) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const org = await auth.api.getFullOrganization({ headers: await headers() });
  if (!org) redirect("/dashboard");

  const member = await prisma.member.findFirst({
    where: { organizationId: org.id, userId: session.user.id },
    select: { role: true, permissions: true },
  });

  if (memberHasPermission(member, key)) return;

  const fallback = firstAllowedHref(member);
  redirect(fallback ?? "/sem-acesso");
};

export const requireUnauth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/");
  }
};

export const currentOrganization = async () => {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!organization) {
    return null;
  }

  return organization;
};
