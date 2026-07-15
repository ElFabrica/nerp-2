import { listMembers } from "./list";
import { updateMemberPermissions } from "./update-permissions";
import { getCurrentMember } from "./get-current";
import { updateMemberRole } from "./update-role";
import { removeMember } from "./remove";

export const memberRoutes = {
  list: listMembers,
  updatePermissions: updateMemberPermissions,
  getCurrent: getCurrentMember,
  updateRole: updateMemberRole,
  remove: removeMember,
};
