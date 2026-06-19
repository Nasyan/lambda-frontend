import { postJson } from "@/shared/api/api-client";

// Instance-zone (Creator) actions — backend prefix /creator.
// All return { status, message, ... }.
export type ActionResponse = {
  status?: string;
  message?: string;
};

// POST /creator/invite-user/ — UserInviteRequest { email }
export function inviteUser(email: string) {
  return postJson<ActionResponse, { email: string }>("/creator/invite-user/", { email });
}

// POST /creator/promote-to-creator/ — PromoteUserRequest { user_uuid }
export function promoteToCreator(userUuid: string) {
  return postJson<ActionResponse, { user_uuid: string }>("/creator/promote-to-creator/", {
    user_uuid: userUuid,
  });
}

// POST /creator/demote-to-user/ — UserRoleChangeRequest { user_uuid }
export function demoteToUser(userUuid: string) {
  return postJson<ActionResponse, { user_uuid: string }>("/creator/demote-to-user/", {
    user_uuid: userUuid,
  });
}

// POST /creator/update-permissions/ — UpdateUserPermissionsRequest { user_uuid, allowed_tools }
export function updatePermissions(userUuid: string, allowedTools: string[]) {
  return postJson<ActionResponse, { user_uuid: string; allowed_tools: string[] }>(
    "/creator/update-permissions/",
    { user_uuid: userUuid, allowed_tools: allowedTools },
  );
}

// POST /creator/deactivate-user/ — UserRoleChangeRequest { user_uuid }
export function deactivateUser(userUuid: string) {
  return postJson<ActionResponse, { user_uuid: string }>("/creator/deactivate-user/", {
    user_uuid: userUuid,
  });
}
