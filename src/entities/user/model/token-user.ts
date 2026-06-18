import type { Role, User } from "@/entities/user/types";

type TokenClaims = {
  email?: unknown;
  instance_id?: unknown;
  name?: unknown;
  role?: unknown;
  sub?: unknown;
};

export function userFromAccessToken(accessToken: string): User | null {
  const claims = readTokenClaims(accessToken);

  if (!claims) {
    return null;
  }

  const email = asString(claims.email) ?? asString(claims.sub);
  const instanceId = asString(claims.instance_id);

  if (!email || !instanceId) {
    return null;
  }

  return {
    email,
    instance_id: instanceId,
    name: asString(claims.name) ?? email,
    role: (asString(claims.role) ?? "user") as Role,
  };
}

function readTokenClaims(accessToken: string): TokenClaims | null {
  const [, payload] = accessToken.split(".");

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as TokenClaims;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  return globalThis.atob(padded);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
