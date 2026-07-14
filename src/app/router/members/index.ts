import { listMembers } from "./list";
import { updateMemberPermissions } from "./update-permissions";
import { updateMemberSupervisor } from "./update-supervisor";
import { getCurrentMember } from "./get-current";

export const memberRoutes = {
  list: listMembers,
  updatePermissions: updateMemberPermissions,
  updateSupervisor: updateMemberSupervisor,
  getCurrent: getCurrentMember,
};
