/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
    pool: "forks",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      include: [
        "src/app/store/**/*.{ts,tsx}",
        "src/app/components/admin/**/*.{ts,tsx}",
        "src/app/components/shop/**/*.{ts,tsx}",
        "src/app/components/news/**/*.{ts,tsx}",
      ],
      exclude: ["**/node_modules/**", "**/dist/**", "**/ui/**"],
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
