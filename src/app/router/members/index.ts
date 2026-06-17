import { listMembers } from "./list";
import { updateMemberPermissions } from "./update-permissions";
import { getCurrentMember } from "./get-current";

export const memberRoutes = {
  list: listMembers,
  updatePermissions: updateMemberPermissions,
  getCurrent: getCurrentMember,
};
