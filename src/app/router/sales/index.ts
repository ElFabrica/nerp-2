import { createSale } from "./create";
import { getSale } from "./get";
import { listSales } from "./list";

export const SalesRoutes = {
  list: listSales,
  get: getSale,
  create: createSale,
};
