import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { ProductsContainer } from "@/features/products/components/products-container";
import { orpc } from "@/lib/orpc";

export default async function Page() {
  return (
    <div className="h-full">
      <ProductsContainer />
    </div>
  );
}
