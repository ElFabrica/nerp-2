import { categoryRoutes } from "./category";
import { orgRoutes } from "./org";
import { productsRoutes } from "./products";
import { catalogSettingsRouter } from "./catalog";
import { stockRoutes } from "./stock";
import { checkoutRouter } from "./checkout";
import { dashboardRoutes } from "./dashboard";
import { customerRoutes } from "./customer";
import { SalesRoutes } from "./sales";
import { kitchenRoutes } from "./pedidos";
import { collaboratorRoutes } from "./collaborators";
import { memberRoutes } from "./members";
import { promotionalCatalogRouter } from "./promotional-catalog";
import { supplierRoutes } from "./supplier";

export const router = {
  products: productsRoutes,
  categories: categoryRoutes,
  catalogSettings: catalogSettingsRouter,
  stocks: stockRoutes,
  org: orgRoutes,
  checkout: checkoutRouter,
  dashboard: dashboardRoutes,
  customer: customerRoutes,
  sales: SalesRoutes,
  kitchen: kitchenRoutes,
  collaborators: collaboratorRoutes,
  members: memberRoutes,
  promotionalCatalog: promotionalCatalogRouter,
  supplier: supplierRoutes,
};
