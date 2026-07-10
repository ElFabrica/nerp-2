import { createStore } from "./create";
import { listStore } from "./list";
import { getStore } from "./get";
import { updateStore } from "./update";
import { deleteStore } from "./delete";

export const storeRoutes = {
  list: listStore,
  create: createStore,
  getOne: getStore,
  update: updateStore,
  delete: deleteStore,
};
