import { createProduct } from "./create";
import { deleteProduct } from "./delete";
import { duplicateProduct } from "./duplicate";
import { getProduct } from "./get";
import { listProducts } from "./list";
import { updateProduct } from "./update";

export const productsRoutes = {
  list: listProducts,
  create: createProduct,
  get: getProduct,
  update: updateProduct,
  delete: deleteProduct,
  duplicate: duplicateProduct,
};
