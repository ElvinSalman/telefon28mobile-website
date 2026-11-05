import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  workers: 3,
  use: {
    baseURL: process.env.TEST_ORIGIN || "http://127.0.0.1:3028",
    channel: "chrome",
    reducedMotion: "reduce",
  },
  webServer: process.env.TEST_ORIGIN
    ? undefined
    : {
        command: "npm run start -- --port 3028",
        url: "http://127.0.0.1:3028/az",
        reuseExistingServer: !process.env.CI,
      },
});
