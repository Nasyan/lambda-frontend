import { postForm } from "@/shared/api/api-client";

import type { LoginRequest, TokenResponse } from "./types";

export function loginByEmail(payload: LoginRequest) {
  return postForm<TokenResponse>("/auth/login/", {
    password: payload.password,
    username: payload.email,
  });
}
