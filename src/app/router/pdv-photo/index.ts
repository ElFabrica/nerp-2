import { createPdvPhoto } from "./create";
import { listPdvPhoto } from "./list";
import { pdvPhotoFilterOptions } from "./filter-options";
import { updatePdvPhoto } from "./update";
import { deletePdvPhoto } from "./delete";

export const pdvPhotoRoutes = {
  list: listPdvPhoto,
  create: createPdvPhoto,
  update: updatePdvPhoto,
  delete: deletePdvPhoto,
  filterOptions: pdvPhotoFilterOptions,
};
