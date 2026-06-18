import { apiClient } from "@/shared/api/api-client";

import type { TokenResponse } from "./types";

export function refreshAuthToken() {
  return apiClient.request<TokenResponse>("/auth/refresh/", {
    method: "POST",
    auth: false,
    skipAuthRefresh: true,
  });
}
