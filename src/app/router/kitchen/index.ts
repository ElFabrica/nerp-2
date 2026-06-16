import { createKitchenOrder } from "./create";
import { listKitchenOrders } from "./list";
import { moveKitchenOrder } from "./move";
import { setArchivedKitchenOrder } from "./archive";
import { publicReadyOrders } from "./public-ready";
import { listKitchenColumns } from "./columns/list";
import { createKitchenColumn } from "./columns/create";
import { updateKitchenColumn } from "./columns/update";
import { deleteKitchenColumn } from "./columns/delete";
import { reorderKitchenColumns } from "./columns/reorder";

export const kitchenRoutes = {
  list: listKitchenOrders,
  create: createKitchenOrder,
  move: moveKitchenOrder,
  setArchived: setArchivedKitchenOrder,
  publicReady: publicReadyOrders,
  columns: {
    list: listKitchenColumns,
    create: createKitchenColumn,
    update: updateKitchenColumn,
    delete: deleteKitchenColumn,
    reorder: reorderKitchenColumns,
  },
};
