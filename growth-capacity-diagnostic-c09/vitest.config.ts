import { defineConfig, configDefaults } from "vitest/config";
import path from "path";

// Keep Vitest (unit tests) and Playwright (e2e/*.e2e.ts) separate so that
// `pnpm test` never tries to run the responsive harness, and vice versa.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
