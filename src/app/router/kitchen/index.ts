import { createKitchenOrder } from "./create";
import { listKitchenOrders } from "./list";
import { markKitchenOrderReady } from "./mark-ready";
import { markKitchenOrderDelivered } from "./mark-delivered";
import { publicReadyOrders } from "./public-ready";

export const kitchenRoutes = {
  list: listKitchenOrders,
  create: createKitchenOrder,
  markReady: markKitchenOrderReady,
  markDelivered: markKitchenOrderDelivered,
  publicReady: publicReadyOrders,
};
