import { create } from "zustand";

import { configureApiAuth } from "@/shared/api/api-client";
import type { User } from "@/entities/user/types";

type AuthPayload = {
  accessToken: string;
  user: User;
};

type UserState = {
  accessToken: string | null;
  clear: () => void;
  setAccessToken: (accessToken: string | null) => void;
  setAuth: (payload: AuthPayload) => void;
  user: User | null;
};

export const useUserStore = create<UserState>((set) => ({
  accessToken: null,
  user: null,
  clear: () => set({ accessToken: null, user: null }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setAuth: ({ accessToken, user }) => set({ accessToken, user }),
}));

configureApiAuth({
  clearAuth: () => useUserStore.getState().clear(),
  getAccessToken: () => useUserStore.getState().accessToken,
  setAccessToken: (accessToken) => useUserStore.getState().setAccessToken(accessToken),
});
