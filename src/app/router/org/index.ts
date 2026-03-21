import { checkSubdomain } from "./check-subdomain";
import { getOrganization } from "./get";
import { updateSubdomain } from "./update-subdomain";

export const orgRoutes = {
  get: getOrganization,
  checkSubdomain: checkSubdomain,
  updateSubdomain: updateSubdomain,
};
