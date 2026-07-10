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
import { rankingRouter } from "./ranking";
import { supplierRoutes } from "./supplier";
import { storeRoutes } from "./store";
import { brandRoutes } from "./brand";
import { floorPlanRoutes } from "./floor-plan";
import { mapLayerRoutes } from "./map-layer";
import { mapObjectRoutes } from "./map-object";

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
  ranking: rankingRouter,
  supplier: supplierRoutes,
  store: storeRoutes,
  brand: brandRoutes,
  floorPlan: floorPlanRoutes,
  mapLayer: mapLayerRoutes,
  mapObject: mapObjectRoutes,
};
