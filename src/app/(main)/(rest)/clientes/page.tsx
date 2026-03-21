import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { AddCustomerModal } from "@/features/custom/components/add-customer";
import { ListCustomers } from "@/features/custom/components/list-customers";
import { PlusIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gerencie seus clientes e acompanhe o histórico de compras"
      >
        <AddCustomerModal>
          <Button>
            <PlusIcon className="size-4" />
            Novo Cliente
          </Button>
        </AddCustomerModal>
      </PageHeader>
      <ListCustomers />
    </div>
  );
}
