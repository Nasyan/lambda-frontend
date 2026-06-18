import { v4 as uuidv4 } from "uuid";

import { env } from "@/shared/config/env";

type AuthHandlers = {
  getAccessToken: () => string | null;
  setAccessToken: (accessToken: string | null) => void;
  clearAuth: () => void;
};

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  skipAuthRefresh?: boolean;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
};

const noopAuthHandlers: AuthHandlers = {
  getAccessToken: () => null,
  setAccessToken: () => undefined,
  clearAuth: () => undefined,
};

let authHandlers = noopAuthHandlers;
let refreshPromise: Promise<string | null> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function configureApiAuth(handlers: AuthHandlers) {
  authHandlers = handlers;
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  return requestWithRefresh<TResponse>(path, options, false);
}

export async function postJson<TResponse, TBody extends object>(
  path: string,
  body: TBody,
  options: Omit<ApiRequestOptions, "body" | "method"> = {},
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    ...options,
    method: "POST",
    headers: withContentType(options.headers, "application/json"),
    body: JSON.stringify(body),
  });
}

export async function postForm<TResponse>(
  path: string,
  values: Record<string, string>,
  options: Omit<ApiRequestOptions, "body" | "method"> = {},
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    ...options,
    method: "POST",
    headers: withContentType(options.headers, "application/x-www-form-urlencoded"),
    body: new URLSearchParams(values),
  });
}

export const apiClient = {
  request: apiRequest,
  post: postJson,
  postForm,
};

async function requestWithRefresh<TResponse>(
  path: string,
  options: ApiRequestOptions,
  hasRetried: boolean,
): Promise<TResponse> {
  const response = await fetch(buildUrl(path), buildRequestInit(options));

  if (
    response.status === 401 &&
    !hasRetried &&
    options.skipAuthRefresh !== true &&
    path !== "/auth/refresh/"
  ) {
    const accessToken = await refreshAccessToken();

    if (accessToken) {
      return requestWithRefresh<TResponse>(path, options, true);
    }
  }

  return parseResponse<TResponse>(response);
}

function buildRequestInit(options: ApiRequestOptions): RequestInit {
  const { auth = true, skipAuthRefresh: _skipAuthRefresh, ...requestInit } = options;
  const headers = new Headers(requestInit.headers);

  if (!headers.has("X-Request-ID")) {
    headers.set("X-Request-ID", uuidv4());
  }

  const accessToken = auth ? authHandlers.getAccessToken() : null;
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return {
    ...requestInit,
    credentials: requestInit.credentials ?? "include",
    headers,
  };
}

function withContentType(headersInit: HeadersInit | undefined, contentType: string): Headers {
  const headers = new Headers(headersInit);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", contentType);
  }

  return headers;
}

async function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= apiRequest<TokenResponse>("/auth/refresh/", {
    method: "POST",
    auth: false,
    skipAuthRefresh: true,
  })
    .then((tokenResponse) => {
      authHandlers.setAccessToken(tokenResponse.access_token);
      return tokenResponse.access_token;
    })
    .catch(() => {
      authHandlers.clearAuth();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function parseResponse<TResponse>(response: Response): Promise<TResponse> {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as TResponse;
    }

    return readBody<TResponse>(response);
  }

  const data = await readBody<unknown>(response);
  throw new ApiError(getErrorMessage(data, response.statusText), response.status, data);
}

async function readBody<TResponse>(response: Response): Promise<TResponse> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json() as Promise<TResponse>;
  }

  const text = await response.text();
  return text as TResponse;
}

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return new URL(path, env.NEXT_PUBLIC_API_URL).toString();
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "string" && data) {
    return data;
  }

  if (isRecord(data)) {
    if (typeof data.message === "string") {
      return data.message;
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }
  }

  return fallback || "API request failed";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
