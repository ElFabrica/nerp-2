import { createBook } from "./create";
import { listBook } from "./list";
import { getBook } from "./get";
import { updateBook } from "./update";
import { deleteBook } from "./delete";
import { importBookPhotos } from "./import-photos";
import { removeBookItem } from "./remove-item";
import { reorderBookItems } from "./reorder-items";
import { generateBookPdf } from "./generate";
import { updateBookCoverLayout } from "./update-cover-layout";
import { getDefaultCoverTemplate } from "./get-default-cover-template";
import { setDefaultCoverTemplate } from "./set-default-cover-template";
import { listSupplierBrands } from "./list-supplier-brands";
import { addBookPage } from "./add-page";

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
  updateCoverLayout: updateBookCoverLayout,
  getDefaultCoverTemplate: getDefaultCoverTemplate,
  setDefaultCoverTemplate: setDefaultCoverTemplate,
  listSupplierBrands: listSupplierBrands,
  addPage: addBookPage,
};
