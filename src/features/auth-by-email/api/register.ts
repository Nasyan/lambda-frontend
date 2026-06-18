import { apiClient } from "@/shared/api/api-client";

import type { ApiMessageResponse, RegisterRequest } from "./types";

export function registerByEmail(payload: RegisterRequest) {
  return apiClient.post<ApiMessageResponse, RegisterRequest>("/auth/register/", payload);
}
