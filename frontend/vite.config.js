import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import "@testing-library/jest-dom/vitest";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    css: true,
    setupFiles: ["./src/tests/setup.js"],
  },
});