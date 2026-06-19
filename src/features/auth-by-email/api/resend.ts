import { apiClient } from "@/shared/api/api-client";

import type { ApiMessageResponse, ResendCodeRequest } from "./types";

export function resendRegistrationCode(payload: ResendCodeRequest) {
  return apiClient.post<ApiMessageResponse, ResendCodeRequest>("/auth/resend-code/", payload);
}
