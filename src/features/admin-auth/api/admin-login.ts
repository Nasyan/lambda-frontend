import { postForm } from "@/shared/api/api-client";

type AdminLoginRequest = {
  email: string;
  password: string;
};

export type AdminTokenResponse = {
  access_token: string;
  token_type: string;
};

export function adminLogin(payload: AdminLoginRequest) {
  return postForm<AdminTokenResponse>("/admin/login/", {
    password: payload.password,
    username: payload.email,
  });
}
