import { createSpaceNegotiation } from "./create";
import { deleteSpaceNegotiation } from "./delete";
import { listSpaceNegotiations } from "./list";
import { updateSpaceNegotiation } from "./update";

export const spaceNegotiationRoutes = {
  create: createSpaceNegotiation,
  list: listSpaceNegotiations,
  update: updateSpaceNegotiation,
  delete: deleteSpaceNegotiation,
};
