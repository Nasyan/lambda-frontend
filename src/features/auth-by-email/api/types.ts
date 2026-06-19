import type { User } from "@/entities/user/types";

export type ApiMessageResponse = {
  message: string;
  status: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type RegisterRequest = {
  email: string;
  name: string;
  password: string;
};

export type VerifyRegistrationRequest = {
  code: string;
  email: string;
};

export type VerifyRegistrationResponse = ApiMessageResponse & {
  user: User;
};

export type ResendCodeRequest = {
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};
