import { createCategory } from "./create";
import { deleteCategory } from "./delete";
import { duplicateCategory } from "./duplicate";
import { listCategories } from "./list";
import { listAllCategories } from "./list-all";
import { listWithoutSubcategory } from "./list-without-sub";
import { updateCategory } from "./update";

export const categoryRoutes = {
  list: listCategories,
  listAll: listAllCategories,
  listWithoutSubcategory: listWithoutSubcategory,
  create: createCategory,
  update: updateCategory,
  duplicate: duplicateCategory,
  delete: deleteCategory,
};
