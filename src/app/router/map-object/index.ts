import { bulkUpsertMapObjects } from "./bulk-upsert";
import { bulkDeleteMapObjects } from "./bulk-delete";
import { getMapObjectAudit } from "./get-audit";

export const mapObjectRoutes = {
  bulkUpsert: bulkUpsertMapObjects,
  bulkDelete: bulkDeleteMapObjects,
  getAudit: getMapObjectAudit,
};
