import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/shared/test/setup.ts"],
    // Unit/component tests live under src/. Playwright e2e specs in tests-e2e/
    // are excluded so vitest does not try to run them.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
