import { createBook } from "./create";
import { listBook } from "./list";
import { getBook } from "./get";
import { updateBook } from "./update";
import { deleteBook } from "./delete";
import { importBookPhotos } from "./import-photos";
import { removeBookItem } from "./remove-item";
import { reorderBookItems } from "./reorder-items";
import { generateBookPdf } from "./generate";

export const bookRoutes = {
  list: listBook,
  create: createBook,
  getOne: getBook,
  update: updateBook,
  delete: deleteBook,
  importPhotos: importBookPhotos,
  removeItem: removeBookItem,
  reorderItems: reorderBookItems,
  generate: generateBookPdf,
};
