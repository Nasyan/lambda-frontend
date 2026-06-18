export type AppMode = "local" | "development" | "test" | "staging" | "production";

function parseAppMode(value: string | undefined): AppMode {
  const fallback = process.env.NODE_ENV === "production" ? "production" : "development";
  const mode = value ?? fallback;

  if (
    mode === "local" ||
    mode === "development" ||
    mode === "test" ||
    mode === "staging" ||
    mode === "production"
  ) {
    return mode;
  }

  return fallback;
}

// The shared/global .env lives one level up (../.env, beside lambda-backend and
// lambda-frontend). Values needed by browser code must be surfaced via
// NEXT_PUBLIC_* in .env.local or next.config.
export const env = {
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000",
  APP_MODE: parseAppMode(process.env.NEXT_PUBLIC_APP_MODE ?? process.env.APP_MODE),
} as const;
