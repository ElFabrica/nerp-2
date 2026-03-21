import { createCustomer } from "./create";
import { listCustomer } from "./list";
import { getCustomer } from "./get";
import { updateCustomer } from "./update";
import { deleteCustomer } from "./delete";

export const customerRoutes = {
  list: listCustomer,
  create: createCustomer,
  getOne: getCustomer,
  update: updateCustomer,
  delete: deleteCustomer,
};
