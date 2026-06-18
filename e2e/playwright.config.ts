import { defineConfig, devices } from '@playwright/test';
import { FRONTEND_URL, BACKEND_URL } from './support/constants';

const backendCwd = '../backend/TodoApi';
const frontendCwd = '../frontend';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'dotnet run --no-launch-profile',
      cwd: backendCwd,
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        ASPNETCORE_URLS: BACKEND_URL,
        // The full suite issues >100 API calls within one rate-limit window
        // (each test logs in + seeds/cleans data). Raise the limit for E2E only;
        // production keeps the 100/min default.
        RateLimiting__PermitLimit: '100000',
      },
    },
    {
      command: 'npm run dev',
      cwd: frontendCwd,
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        // The browser calls the API directly (not via the Vite proxy), so point
        // the app's API base URL at the E2E backend port (see constants.ts).
        VITE_API_URL: `${BACKEND_URL}/api`,
      },
    },
  ],
});
