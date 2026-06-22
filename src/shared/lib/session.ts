export interface AccessTokenPayload {
  instance_uuid?: string | null;
  exp?: number;
  [key: string]: unknown;
}

const decodeBase64Url = (value: string): string => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  return decodeURIComponent(
    atob(paddedBase64)
      .split("")
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join(""),
  );
};

export const parseAccessToken = (token: string): AccessTokenPayload | null => {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const parsedPayload: unknown = JSON.parse(decodeBase64Url(payload));
    if (parsedPayload && typeof parsedPayload === "object") {
      return parsedPayload as AccessTokenPayload;
    }

    return null;
  } catch {
    return null;
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("access_token");
};

export const getInstanceUuidFromAccessToken = (): string | null => {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  return parseAccessToken(token)?.instance_uuid ?? null;
};
