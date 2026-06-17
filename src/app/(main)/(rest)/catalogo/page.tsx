import { CatalogSettings } from "@/features/catalogo/components/catalog";
import { requirePermission } from "@/lib/auth-utils";

export default async function Page() {
  await requirePermission("catalogo");
  return <CatalogSettings />;
}
