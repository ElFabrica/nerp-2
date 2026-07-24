import { runErpSyncNow } from "./run";
import { getErpSyncStatus } from "./status";

export const erpSyncRoutes = {
  status: getErpSyncStatus,
  run: runErpSyncNow,
};
