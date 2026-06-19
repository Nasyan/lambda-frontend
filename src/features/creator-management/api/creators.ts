import { apiRequest } from "@/shared/api/api-client";
import type { Creator } from "@/entities/creator/types";

// GET /admin/creators/ -> List[CreatorResponse]
export function listCreators() {
  return apiRequest<Creator[]>("/admin/creators/");
}

// GET /admin/creators/{creator_uuid} -> CreatorResponse
export function getCreator(creatorUuid: string) {
  return apiRequest<Creator>(`/admin/creators/${creatorUuid}`);
}

// PATCH /admin/creators/{creator_uuid}/deactivate -> CreatorResponse
export function deactivateCreator(creatorUuid: string) {
  return apiRequest<Creator>(`/admin/creators/${creatorUuid}/deactivate`, {
    method: "PATCH",
  });
}
