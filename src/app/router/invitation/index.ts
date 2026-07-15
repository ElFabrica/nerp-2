import { acceptInvitation } from "./accept";
import { cancelInvitation } from "./cancel";
import { createInvitation } from "./create";
import { getInvitation } from "./get";
import { listInvitations } from "./list";
import { rejectInvitation } from "./reject";
import { resendInvitation } from "./resend";

export const invitationRoutes = {
  create: createInvitation,
  list: listInvitations,
  get: getInvitation,
  cancel: cancelInvitation,
  resend: resendInvitation,
  accept: acceptInvitation,
  reject: rejectInvitation,
};
