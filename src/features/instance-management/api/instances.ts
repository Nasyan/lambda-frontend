import { apiRequest, postJson } from "@/shared/api/api-client";
import type { Instance } from "@/entities/instance/types";

// POST /admin/instances/ — InstanceCreateRequest { title } -> InstanceResponse
export type CreateInstanceRequest = {
  title: string;
};

export function createInstance(payload: CreateInstanceRequest) {
  return postJson<Instance, CreateInstanceRequest>("/admin/instances/", payload);
}

// GET /admin/instances/ -> List[InstanceResponse]
export function listInstances() {
  return apiRequest<Instance[]>("/admin/instances/");
}
