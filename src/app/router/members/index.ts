import { listMembers } from "./list";
import { updateMemberPermissions } from "./update-permissions";
import { updateMemberSupervisor } from "./update-supervisor";
import { getCurrentMember } from "./get-current";
import { updateMemberRole } from "./update-role";
import { updateMyModules } from "./update-my-modules";
import { removeMember } from "./remove";

export const memberRoutes = {
  list: listMembers,
  updatePermissions: updateMemberPermissions,
  updateSupervisor: updateMemberSupervisor,
  updateMyModules: updateMyModules,
  getCurrent: getCurrentMember,
  updateRole: updateMemberRole,
  remove: removeMember,
};
