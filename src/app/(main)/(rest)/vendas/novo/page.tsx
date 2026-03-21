import { PageHeader } from "@/components/page-header";
import CreateSalePage from "@/features/sales/components/novo/create-sale";

export default async function Page() {
  return (
    <>
      <PageHeader title="Nova Venda" description="Crie uma nova venda" />
      <CreateSalePage />
    </>
  );
}
