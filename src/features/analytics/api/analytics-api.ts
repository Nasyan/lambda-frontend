import { getAccessToken } from "@/src/shared/lib/session";
import type {
  WidgetResponse,
  WidgetCreatePayload,
  WidgetUpdatePayload,
  WidgetDataPoint,
} from "@/src/entities/analytics/model/types";

// Берем базовый URL бэкенда из переменных окружения.
// Если она не задана, используем твой локальный порт бэкенда по умолчанию.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Вспомогательная функция для сборки полного URL без лишних двойных слэшей
function buildUrl(path: string): string {
  const cleanBase = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  if (!token) throw new Error("Нет токена авторизации");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  // ВАЖНО: Обязательно собираем полный URL до бэкенда
  const fullUrl = buildUrl(url);

  const response = await fetch(fullUrl, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorDetail =
      typeof errorData?.detail === "object"
        ? JSON.stringify(errorData.detail)
        : errorData?.detail;
    throw new Error(errorDetail || `Ошибка HTTP Analytics: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const analyticsApi = {
  // Получить все виджеты инстанса
  getWidgets: (instanceUuid: string): Promise<WidgetResponse[]> =>
    fetchWithAuth(`/instances/${instanceUuid}/widgets`),

  // Создать новый виджет
  createWidget: (
    instanceUuid: string,
    payload: WidgetCreatePayload,
  ): Promise<WidgetResponse> =>
    fetchWithAuth(`/instances/${instanceUuid}/widgets`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Обновить конфигурацию виджета
  updateWidget: (
    instanceUuid: string,
    widgetUuid: string,
    payload: WidgetUpdatePayload,
  ): Promise<WidgetResponse> =>
    fetchWithAuth(`/instances/${instanceUuid}/widgets/${widgetUuid}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // Удалить виджет
  deleteWidget: (instanceUuid: string, widgetUuid: string): Promise<void> =>
    fetchWithAuth(`/instances/${instanceUuid}/widgets/${widgetUuid}`, {
      method: "DELETE",
    }),

  // Получить агрегированные на лету данные точек графика
  getWidgetData: (
    instanceUuid: string,
    widgetUuid: string,
    filters?: { date_from?: string; date_to?: string; date_field?: string },
  ): Promise<WidgetDataPoint[]> => {
    const params = new URLSearchParams();
    if (filters?.date_from) params.append("date_from", filters.date_from);
    if (filters?.date_to) params.append("date_to", filters.date_to);
    if (filters?.date_field) params.append("date_field", filters.date_field);

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return fetchWithAuth(
      `/instances/${instanceUuid}/widgets/${widgetUuid}/data${queryStr}`,
    );
  },

  // Ссылка для скачивания CSV файла напрямую (здесь тоже нужен полный URL до бэка!)
  getExportCsvUrl: (
    instanceUuid: string,
    widgetUuid: string,
    filters?: { date_from?: string; date_to?: string; date_field?: string },
  ): string => {
    const params = new URLSearchParams();
    if (filters?.date_from) params.append("date_from", filters.date_from);
    if (filters?.date_to) params.append("date_to", filters.date_to);
    if (filters?.date_field) params.append("date_field", filters.date_field);

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return buildUrl(
      `/instances/${instanceUuid}/widgets/${widgetUuid}/export-csv${queryStr}`,
    );
  },
};
