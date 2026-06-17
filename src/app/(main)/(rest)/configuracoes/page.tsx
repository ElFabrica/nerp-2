import { PageHeader } from "@/components/page-header";
import { PermissionsPanel } from "@/features/configuracoes/components/permissions-panel";
import { requirePermission } from "@/lib/auth-utils";

export default async function Page() {
  await requirePermission("configuracoes");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Permissões de páginas dos membros da organização."
      />
      <PermissionsPanel />
    </div>
  );
}
