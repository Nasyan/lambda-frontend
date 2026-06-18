import { apiClient } from "@/shared/api/api-client";

import type { VerifyRegistrationRequest, VerifyRegistrationResponse } from "./types";

export function verifyRegistration(payload: VerifyRegistrationRequest) {
  return apiClient.post<VerifyRegistrationResponse, VerifyRegistrationRequest>(
    "/auth/verify-registration/",
    payload,
  );
}
