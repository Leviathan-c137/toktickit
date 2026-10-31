import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: process.platform === "win32" ? "cmd /c npm run dev --prefix ../server" : "npm run dev --prefix ../server",
      url: "http://localhost:3000/api/health",
      reuseExistingServer: true,
      timeout: 60 * 1000,
    },
    {
      command: process.platform === "win32" ? "cmd /c npm run dev" : "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 60 * 1000,
    },
  ],
});
