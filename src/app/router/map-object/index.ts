import { bulkUpsertMapObjects } from "./bulk-upsert";
import { bulkDeleteMapObjects } from "./bulk-delete";

export const mapObjectRoutes = {
  bulkUpsert: bulkUpsertMapObjects,
  bulkDelete: bulkDeleteMapObjects,
};
