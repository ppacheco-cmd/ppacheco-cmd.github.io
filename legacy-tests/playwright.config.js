const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: '.',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    reporter: [['list']],
    use: {
        baseURL: 'http://127.0.0.1:4173',
        // Uses the Google Chrome installed on the machine (no browser download needed).
        // In CI, switch to the bundled Chromium: remove `channel` and run `npx playwright install chromium`.
        channel: process.env.CI ? undefined : 'chrome',
        headless: true,
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'node scripts/serve.js',
        cwd: '..',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: true,
    },
});
