import { getAccessToken } from "@/src/shared/lib/session";
import type {
  TriggerResponse,
  TriggerCreatePayload,
  TriggerExecuteResponse,
  TriggerUpdatePayload,
} from "@/src/entities/trigger/model/types";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  if (!token) throw new Error("Нет токена авторизации");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    // Обрабатываем формат ошибок FastAPI (например, detail может быть строкой или массивом)
    const errorDetail =
      typeof errorData?.detail === "object"
        ? JSON.stringify(errorData.detail)
        : errorData?.detail;
    throw new Error(errorDetail || `Ошибка HTTP: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const triggerApi = {
  getTriggers: (instanceUuid: string): Promise<TriggerResponse[]> =>
    fetchWithAuth(`/instances/${instanceUuid}/triggers/`),

  createTrigger: (
    instanceUuid: string,
    payload: TriggerCreatePayload,
  ): Promise<TriggerResponse> =>
    fetchWithAuth(`/instances/${instanceUuid}/triggers/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateTrigger: (
    instanceUuid: string,
    triggerId: string,
    payload: TriggerUpdatePayload,
  ): Promise<TriggerResponse> =>
    fetchWithAuth(`/instances/${instanceUuid}/triggers/${triggerId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteTrigger: (instanceUuid: string, triggerId: string): Promise<void> =>
    fetchWithAuth(`/instances/${instanceUuid}/triggers/${triggerId}`, {
      method: "DELETE",
    }),

  executeTrigger: (
    instanceUuid: string,
    triggerId: string,
  ): Promise<TriggerExecuteResponse> =>
    fetchWithAuth(`/instances/${instanceUuid}/triggers/${triggerId}/execute`, {
      method: "POST",
    }),
};
