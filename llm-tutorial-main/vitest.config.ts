import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // tests/ui holds Playwright (.spec.js) specs with their own runner.
    exclude: ["tests/ui/**", "node_modules/**"],
  },
});
