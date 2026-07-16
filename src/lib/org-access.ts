import "server-only";

import prisma from "@/lib/db";
import { hasFullAccess } from "@/lib/permissions";

export async function getMemberRole(
  orgId: string,
  userId: string,
): Promise<string | null> {
  const member = await prisma.member.findFirst({
    where: { organizationId: orgId, userId },
    select: { role: true },
  });
  return member?.role ?? null;
}

// Handlers checam isto e lançam via o `errors` tipado do procedure.
export async function isOrgAdmin(
  orgId: string,
  userId: string,
): Promise<boolean> {
  return hasFullAccess(await getMemberRole(orgId, userId));
}
