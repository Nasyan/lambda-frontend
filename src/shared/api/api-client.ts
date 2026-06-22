export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${API_URL}${path}`;
};

const parseResponseData = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || undefined;
};

const createBody = (payload: unknown, headers: Headers): BodyInit | undefined => {
  if (payload === undefined) {
    return undefined;
  }

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

const refreshAccessToken = async (): Promise<string> => {
  const response = await fetch(buildUrl("/auth/refresh/"), {
    method: "POST",
    credentials: "include",
  });

  const data = await parseResponseData(response);
  if (!response.ok) {
    throw new ApiClientError(response.status, data, "Unable to refresh token");
  }

  const accessToken =
    data && typeof data === "object"
      ? (data as { access_token?: unknown }).access_token
      : undefined;

  if (typeof accessToken !== "string") {
    throw new Error("Refresh response does not contain access_token");
  }

  localStorage.setItem("access_token", accessToken);
  return accessToken;
};

const request = async <T>(
  method: string,
  path: string,
  payload?: unknown,
  config?: ApiRequestConfig,
  isRetry = false,
): Promise<ApiResponse<T>> => {
  const headers = new Headers(config?.headers);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    credentials: "include",
    body: createBody(payload, headers),
  });

  const data = await parseResponseData(response);

  if (response.status === 401 && !isRetry) {
    try {
      await refreshAccessToken();
      return request<T>(method, path, payload, config, true);
    } catch {
      localStorage.removeItem("access_token");
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    }
  }

  if (!response.ok) {
    throw new ApiClientError(response.status, data, response.statusText);
  }

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
};
