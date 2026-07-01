import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321 --strictPort',
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
