import { isTokenExpired } from "../lib/session"; // Убедись, что путь правильный

interface ApiRequestConfig {
  headers?: HeadersInit;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export class ApiClientError extends Error {
  response: {
    status: number;
    data: unknown;
  };

  constructor(status: number, data: unknown, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.response = { status, data };
  }
}

export const isApiClientError = (error: unknown): error is ApiClientError =>
  error instanceof ApiClientError;

// ВНИМАНИЕ: Если API на другом порту, тебе нужно добавлять BASE_URL.
// Например: const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const buildUrl = (path: string): string => {
  // Если путь уже абсолютный (начинается с http:// или https://), оставляем как есть
  if (/^https?:\/\//.test(path)) return path;

  // Корректно склеиваем BASE_URL и относительный путь
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

const parseResponseData = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || undefined;
};

const createBody = (
  payload: unknown,
  headers: Headers,
): BodyInit | undefined => {
  if (payload === undefined) return undefined;

  if (
    payload instanceof URLSearchParams ||
    payload instanceof FormData ||
    payload instanceof Blob ||
    typeof payload === "string"
  ) {
    return payload;
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return JSON.stringify(payload);
};

// --- АТОМАРНЫЙ ЕДИНЫЙ ПРОМИС ДЛЯ РЕФРЕША ---
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const timestamp = new Date().toISOString();
  const refreshUrl = buildUrl("/auth/refresh");

  console.warn(
    `[API_CLIENT] [${timestamp}] 🔄 Инициирован POST запрос на рефреш. URL: ${refreshUrl}`,
  );

  let response;
  try {
    response = await fetch(refreshUrl, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error(
      `[API_CLIENT] ❌ Сетевая ошибка при попытке рефреша (Failed to fetch). URL: ${refreshUrl}`,
      error,
    );
    throw error;
  }

  const data = await parseResponseData(response);

  if (!response.ok) {
    console.error(
      `[API_CLIENT] Сервер ответил ошибкой на рефреш. Статус: ${response.status}`,
      "\nДетали ответа:",
      JSON.stringify(data, null, 2),
    );
    throw new ApiClientError(response.status, data, "Unable to refresh token");
  }

  const accessToken =
    data && typeof data === "object"
      ? (data as { access_token?: unknown }).access_token
      : undefined;

  if (typeof accessToken !== "string") {
    console.error(
      "[API_CLIENT] Ответ рефреша успешный, но поле access_token пустое или не строка",
      "\nТело ответа:",
      JSON.stringify(data, null, 2),
    );
    throw new Error("Refresh response does not contain access_token");
  }

  console.log(
    "[API_CLIENT] ✅ Рефреш успешно выполнен. Новый access_token записан в localStorage.",
  );
  localStorage.setItem("access_token", accessToken);
  return accessToken;
};

const handleRefreshAndRetry = async <T>(
  method: string,
  path: string,
  payload: unknown,
  config?: ApiRequestConfig,
): Promise<ApiResponse<T>> => {
  const timestamp = new Date().toISOString();

  if (refreshPromise) {
    console.log(
      `[API_CLIENT] [${timestamp}] ⏳ Запрос [${method} ${path}] ждет завершения активного рефреша.`,
    );
  } else {
    console.warn(
      `[API_CLIENT] [${timestamp}] 🔑 Запрос [${method} ${path}] запускает процесс рефреша токена.`,
    );
    refreshPromise = refreshAccessToken().finally(() => {
      console.log(
        "[API_CLIENT] Единый промис рефреша завершил работу. Очистка.",
      );
      refreshPromise = null;
    });
  }

  try {
    const newToken = await refreshPromise;
    console.log(
      `[API_CLIENT] Ожидание рефреша для [${method} ${path}] завершено. Повторяем запрос...`,
    );

    const updatedConfig = {
      ...config,
      headers: {
        ...(config?.headers as Record<string, string>),
        Authorization: `Bearer ${newToken}`,
      },
    };

    return await request<T>(method, path, payload, updatedConfig, true);
  } catch (error) {
    console.error(
      `[API_CLIENT] 🚨 Критическая ошибка рефреша в цепочке для [${method} ${path}]. Очистка сессии и редирект.`,
      error,
    );

    localStorage.removeItem("access_token");
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login")
    ) {
      console.warn("[API_CLIENT] Редирект на /login");
      window.location.href = "/login";
    }
    throw error;
  }
};

const request = async <T>(
  method: string,
  path: string,
  payload?: unknown,
  config?: ApiRequestConfig,
  isRetry = false,
): Promise<ApiResponse<T>> => {
  const timestamp = new Date().toISOString();
  const finalUrl = buildUrl(path);

  if (refreshPromise && !isRetry && !path.includes("/auth/")) {
    console.log(
      `[API_CLIENT] [${timestamp}] 🛑 Перехват: запрос [${method} ${path}] остановлен, так как идет рефреш.`,
    );
    return handleRefreshAndRetry<T>(method, path, payload, config);
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  if (token && isTokenExpired(token) && !isRetry && !path.includes("/auth/")) {
    console.warn(
      `[API_CLIENT] [${timestamp}] ⚠️ Превентивная проверка: Токен протух. Запрос [${method} ${path}] направлен на рефреш.`,
    );
    return handleRefreshAndRetry<T>(method, path, payload, config);
  }

  // >>> ГЛАВНЫЙ ЛОГ ДЛЯ ОТЛАДКИ URL <<<
  console.log(
    `[API_CLIENT] [${timestamp}] 🚀 ОТПРАВКА ЗАПРОСА:\n` +
      `  Метод: ${method}\n` +
      `  Путь (оригинал): ${path}\n` +
      `  URL (итоговый): ${finalUrl}\n` +
      `  Токен в наличии: ${!!token}\n` +
      `  Повтор (isRetry): ${isRetry}`,
  );

  const headers = new Headers(config?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(finalUrl, {
      method,
      headers,
      credentials: "include",
      body: createBody(payload, headers),
    });
  } catch (error) {
    // ЕСЛИ ЗАПРОС ПАДАЕТ ТУТ (Failed to fetch) - ЭТО ПРОБЛЕМА С URL, ПОРТОМ ИЛИ CORS
    console.error(
      `[API_CLIENT] 💥 СЕТЕВАЯ ОШИБКА (Failed to fetch) при запросе к бэкенду.\n` +
        `  URL: ${finalUrl}\n` +
        `  Метод: ${method}\n` +
        `  Возможно, фронтенд стучится не на тот порт (например на 3000 вместо 8000), или бэкенд не запущен.`,
      error,
    );
    throw error;
  }

  const data = await parseResponseData(response);

  if (response.status === 401 && !isRetry && !path.includes("/auth/")) {
    console.error(
      `[API_CLIENT] [${timestamp}] 🚫 Запрос [${method} ${finalUrl}] получил 401 Unauthorized. Идем на фоллбек-рефреш.`,
    );
    return handleRefreshAndRetry<T>(method, path, payload, config);
  }

  if (!response.ok) {
    console.error(
      `[API_CLIENT] ❌ Запрос [${method} ${finalUrl}] завершился с ошибкой HTTP ${response.status}`,
      "\nДетали ответа бэкенда:",
      JSON.stringify(data, null, 2),
    );
    throw new ApiClientError(response.status, data, response.statusText);
  }

  console.log(
    `[API_CLIENT] ✅ Запрос [${method} ${finalUrl}] успешно выполнен. Код: ${response.status}`,
  );

  return {
    data: data as T,
    status: response.status,
    headers: response.headers,
  };
};

export const apiClient = {
  get: <T>(path: string, config?: ApiRequestConfig) =>
    request<T>("GET", path, undefined, config),
  post: <T>(path: string, payload?: unknown, config?: ApiRequestConfig) =>
    request<T>("POST", path, payload, config),
  patch: <T>(path: string, payload?: unknown, config?: ApiRequestConfig) =>
    request<T>("PATCH", path, payload, config),
  delete: <T>(path: string, config?: ApiRequestConfig) =>
    request<T>("DELETE", path, undefined, config),
  put: <T>(path: string, payload?: unknown, config?: ApiRequestConfig) =>
    request<T>("PUT", path, payload, config),
};
