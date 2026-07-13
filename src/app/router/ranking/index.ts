import { createSalesGoalEntry } from "./create-entry";
import { deleteSalesGoalEntry } from "./delete-entry";
import { listSalesGoalEvolution } from "./evolution";
import { importSalesGoalRanking } from "./import";
import { listSalesGoalRanking } from "./list";
import { listSalesGoalPeriods } from "./list-periods";
import { getSalesGoalRankingSettings } from "./settings/get";
import { updateSalesGoalRankingSettings } from "./settings/update";
import { updateSalesGoalBranch } from "./update-branch";
import { upsertSalesGoalEntry } from "./upsert-entry";

export const rankingRouter = {
  list: listSalesGoalRanking,
  listPeriods: listSalesGoalPeriods,
  import: importSalesGoalRanking,
  createEntry: createSalesGoalEntry,
  upsertEntry: upsertSalesGoalEntry,
  deleteEntry: deleteSalesGoalEntry,
  updateBranch: updateSalesGoalBranch,
  evolution: listSalesGoalEvolution,
  settings: {
    get: getSalesGoalRankingSettings,
    update: updateSalesGoalRankingSettings,
  },
};
