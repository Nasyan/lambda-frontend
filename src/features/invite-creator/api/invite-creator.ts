import { postJson } from "@/shared/api/api-client";

// POST /admin/invite-creator/ — CreatorInviteRequest { email, instance_id }
export type InviteCreatorRequest = {
  email: string;
  instance_id: string;
};

export type InviteCreatorResponse = {
  status?: string;
  message?: string;
};

export function inviteCreator(payload: InviteCreatorRequest) {
  return postJson<InviteCreatorResponse, InviteCreatorRequest>(
    "/admin/invite-creator/",
    payload,
  );
}
