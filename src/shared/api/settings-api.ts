import { apiClient } from "../api/api-client";
import {
  SettingsContextResponse,
  UiKitItem,
} from "@/src/entities/user/model/types";

export const settingsApi = {
  // Получение обычного контекста
  getMyContext: async (): Promise<SettingsContextResponse> => {
    const response =
      await apiClient.get<SettingsContextResponse>("/users/me/context");
    return response.data;
  },

  // Получение контекста Креатора
  getCreatorContext: async (): Promise<SettingsContextResponse> => {
    const response = await apiClient.get<SettingsContextResponse>(
      "/users/me/creator/context",
    );
    return response.data;
  },

  // Полное обновление UI-кита (перезапись)
  updateUiKit: async (payload: { favorites: UiKitItem[] }) => {
    const response = await apiClient.put<{ status: string }>(
      "/users/me/ui-kit",
      payload,
    );
    return response.data;
  },

  // --- НОВЫЕ CRUD ЭНДПОИНТЫ ДЛЯ UI-KIT ---

  addUiKitItem: async (item: UiKitItem) => {
    const response = await apiClient.post<{ status: string; message: string }>(
      "/users/me/ui-kit/item",
      item,
    );
    return response.data;
  },

  updateUiKitItemPosition: async (
    uuid: string,
    position: { x: number; y: number },
  ) => {
    const response = await apiClient.patch<{ status: string; message: string }>(
      `/users/me/ui-kit/item/${uuid}/position`,
      position,
    );
    return response.data;
  },

  removeUiKitItem: async (uuid: string) => {
    const response = await apiClient.delete<{
      status: string;
      message: string;
    }>(`/users/me/ui-kit/item/${uuid}`);
    return response.data;
  },

  clearUiKit: async () => {
    const response = await apiClient.delete<{
      status: string;
      message: string;
    }>("/users/me/ui-kit");
    return response.data;
  },
  inviteUser: async (email: string) => {
    const response = await apiClient.post<{ status: string; message: string }>(
      "/creator/invite-user/",
      { email },
    );
    return response.data;
  },

  promoteToCreator: async (user_uuid: string) => {
    const response = await apiClient.post<{ status: string; message: string }>(
      "/creator/promote-to-creator/",
      { user_uuid },
    );
    return response.data;
  },

  demoteToUser: async (user_uuid: string) => {
    const response = await apiClient.post<{ status: string; message: string }>(
      "/creator/demote-to-user/",
      { user_uuid },
    );
    return response.data;
  },

  updateUserPermissions: async (user_uuid: string, allowed_tools: string[]) => {
    const response = await apiClient.post<{
      status: string;
      message: string;
      allowed_tools: string[];
    }>("/creator/update-permissions/", { user_uuid, allowed_tools });
    return response.data;
  },

  deactivateUser: async (user_uuid: string) => {
    const response = await apiClient.post<{ status: string; message: string }>(
      "/creator/deactivate-user/",
      { user_uuid },
    );
    return response.data;
  },
};
