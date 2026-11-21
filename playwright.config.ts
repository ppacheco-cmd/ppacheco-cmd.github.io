import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

/**
 * Load environment variables from .env file.
 * Defaults to ./env/.env.dev if ENVIRONMENT is not set.
 *
 * Usage:
 *   ENVIRONMENT=live npx playwright test
 */
const environment = process.env.ENVIRONMENT ?? 'dev';
dotenv.config({ path: `./env/.env.${environment}`, quiet: true });

/** Local static server used when the site is tested from this checkout */
const LOCAL_SERVER_PORT = 4173;

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI
        ? [['blob'], ['html', { open: 'never' }]]
        : [['html', { open: 'never' }], ['list']],

    use: {
        baseURL: process.env.APP_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        actionTimeout: 10000,
        navigationTimeout: 30000,
    },

    timeout: 30000,
    expect: { timeout: 10000 },

    /* Serve this checkout locally, unless a different APP_URL is being tested */
    webServer: process.env.APP_URL?.includes(`:${LOCAL_SERVER_PORT}`)
        ? {
              command: 'node scripts/serve.js',
              url: process.env.APP_URL,
              reuseExistingServer: true,
          }
        : undefined,

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Use the Chrome installed on this machine; CI installs Chromium
                channel: process.env.CI ? undefined : 'chrome',
                viewport: { width: 1280, height: 800 },
            },
        },

        /* Other engines: only when CROSS_BROWSER is set (the overnight run) */
        ...(process.env.CROSS_BROWSER
            ? [
                  {
                      name: 'firefox',
                      use: {
                          ...devices['Desktop Firefox'],
                          viewport: { width: 1280, height: 800 },
                      },
                  },
                  {
                      name: 'webkit',
                      use: {
                          ...devices['Desktop Safari'],
                          viewport: { width: 1280, height: 800 },
                      },
                  },
              ]
            : []),
    ],
});
