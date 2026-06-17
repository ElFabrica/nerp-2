import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { WaiterApp } from "@/features/pedidos/waiter/components/waiter-app";
import { NoAccessNotice } from "@/features/pedidos/waiter/components/no-access-notice";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export const metadata: Metadata = {
  title: "Registrar pedido",
};

// Acesso requer login + membership na org do QR. Quem escaneia e não tem
// sessão é mandado para /login com redirectTo de volta. Sem convite/member,
// mostra uma tela neutra pedindo para o admin liberar.
export default async function RegistrarPedidoPage({ params }: Props) {
  const { orgSlug } = await params;
  const headersList = await headers();

  const session = await auth.api.getSession({ headers: headersList });
  if (!session) {
    const redirectTo = encodeURIComponent(`/registrar-pedido/${orgSlug}`);
    redirect(`/login?redirectTo=${redirectTo}`);
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true },
  });
  if (!org) {
    return <NoAccessNotice orgName={orgSlug} reason="not-found" />;
  }

  const member = await prisma.member.findFirst({
    where: { organizationId: org.id, userId: session.user.id },
    select: { id: true },
  });
  if (!member) {
    return <NoAccessNotice orgName={org.name} reason="no-membership" />;
  }

  return <WaiterApp orgSlug={orgSlug} />;
}
