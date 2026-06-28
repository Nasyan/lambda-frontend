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

const buildUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
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
  console.warn(
    `[API_CLIENT] [${timestamp}] Инициирован реальный сетевой запрос POST /auth/refresh/`,
  );

  const response = await fetch(buildUrl("/auth/refresh/"), {
    method: "POST",
    credentials: "include",
  });

  const data = await parseResponseData(response);

  if (!response.ok) {
    console.error(
      `[API_CLIENT] Сервер ответил ошибкой на рефреш. Статус: ${response.status}`,
      data,
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
      data,
    );
    throw new Error("Refresh response does not contain access_token");
  }

  console.log(
    "[API_CLIENT] Рефреш успешно выполнен. Новый access_token записан в localStorage.",
  );
  localStorage.setItem("access_token", accessToken);
  return accessToken;
};

// Единая функция-контроллер для блокировки параллельных рефрешей
const handleRefreshAndRetry = async <T>(
  method: string,
  path: string,
  payload: unknown,
  config?: ApiRequestConfig,
): Promise<ApiResponse<T>> => {
  const timestamp = new Date().toISOString();

  if (refreshPromise) {
    console.log(
      `[API_CLIENT] [${timestamp}] Запрос [${method} ${path}] обнаружил активный рефреш. Встает в ожидание промиса.`,
    );
  } else {
    console.warn(
      `[API_CLIENT] [${timestamp}] Запрос [${method} ${path}] берет на себя создание единого промиса рефреша.`,
    );
    refreshPromise = refreshAccessToken().finally(() => {
      console.log(
        "[API_CLIENT] Единый промис рефреша завершил работу. Сброс триггера.",
      );
      refreshPromise = null;
    });
  }

  try {
    // Все параллельные запросы будут ждать выполнения этой строчки
    const newToken = await refreshPromise;

    console.log(
      `[API_CLIENT] Ожидание рефреша для [${method} ${path}] завершено. Повторяем запрос со свежим Bearer токеном.`,
    );

    const updatedConfig = {
      ...config,
      headers: {
        ...(config?.headers as Record<string, string>),
        Authorization: `Bearer ${newToken}`,
      },
    };

    // Делаем повтор с флагом isRetry = true
    return await request<T>(method, path, payload, updatedConfig, true);
  } catch (error) {
    console.error(
      `[API_CLIENT] Критическая ошибка рефреша в цепочке для запроса [${method} ${path}]. Очистка сессии и редирект.`,
    );

    localStorage.removeItem("access_token");
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login")
    ) {
      console.warn("[API_CLIENT] Редирект пользователя на /login");
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

  // КЕЙС 0: Если прямо сейчас идет рефреш, а запрос НЕ повторный — отправляем его ждать
  if (refreshPromise && !isRetry && !path.includes("/auth/")) {
    console.log(
      `[API_CLIENT] [${timestamp}] Перехват на взлете: запрос [${method} ${path}] остановлен, так как идет рефреш.`,
    );
    return handleRefreshAndRetry<T>(method, path, payload, config);
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // ПРЕВЕНТИВНАЯ ПРОВЕРКА: Проверка протухания до отправки
  if (token && isTokenExpired(token) && !isRetry && !path.includes("/auth/")) {
    console.warn(
      `[API_CLIENT] [${timestamp}] Превентивная проверка: Токен протух. Отправляем запрос [${method} ${path}] на рефреш.`,
    );
    return handleRefreshAndRetry<T>(method, path, payload, config);
  }

  console.log(
    `[API_CLIENT] [${timestamp}] Отправка сетевого запроса: [${method} ${path}] (Повтор: ${isRetry})`,
  );

  const headers = new Headers(config?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    credentials: "include",
    body: createBody(payload, headers),
  });

  const data = await parseResponseData(response);

  // ФОЛЛБЕК НА 401: Если бэкенд отбил запрос, а превентивно мы это не поймали
  if (response.status === 401 && !isRetry && !path.includes("/auth/")) {
    console.error(
      `[API_CLIENT] [${timestamp}] Запрос [${method} ${path}] получил внезапный 401 от бэкенда. Отправка на фоллбек-рефреш.`,
    );
    return handleRefreshAndRetry<T>(method, path, payload, config);
  }

  if (!response.ok) {
    console.error(
      `[API_CLIENT] Запрос [${method} ${path}] завершился ошибкой HTTP ${response.status}`,
    );
    throw new ApiClientError(response.status, data, response.statusText);
  }

  console.log(
    `[API_CLIENT] Запрос [${method} ${path}] успешно выполнен. Код: ${response.status}`,
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
