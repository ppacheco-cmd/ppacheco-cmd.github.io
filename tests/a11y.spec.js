// Automated accessibility checks with axe-core (WCAG 2.0 / 2.1 / 2.2, levels A and AA, plus axe best practices).
// Every page is checked in light and dark theme, on desktop and on a phone, and with an answer panel open.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

function describe(violations) {
  return violations.map((v) =>
    `${v.id} (${v.impact}): ${v.help}\n` +
    v.nodes.slice(0, 5).map((n) => `    ${n.target.join(' ')}  ->  ${(n.failureSummary || '').split('\n').slice(1).join(' ')}`).join('\n'),
  ).join('\n');
}

async function scan(page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations, describe(results.violations)).toEqual([]);
  // make sure axe actually evaluated a meaningful number of rules
  expect(results.passes.length).toBeGreaterThan(15);
}

const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  phone: { width: 390, height: 844 },
};

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  for (const theme of ['light', 'dark']) {
    test.describe(`axe: ${vpName}, ${theme} theme`, () => {
      // reduced motion removes colour transitions so contrast is measured on settled colours
      test.use({ viewport, colorScheme: theme, reducedMotion: 'reduce' });

      test('home page', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await scan(page);
      });

      test('home page with a question answered', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Do you have mobile experience?' }).click();
        await expect(page.locator('#answer h3')).toBeVisible();
        await scan(page);
      });

      test('home page right after clicking the CV button (success state)', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: 'Download CV (PDF)', exact: true }).click();
        await expect(page.locator('.cv-btn')).toHaveAttribute('data-state', 'done');
        await scan(page);
      });

      test('home page with the "?" help open', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'What does a QA engineer do?' }).click();
        await expect(page.locator('#qa-help')).toBeVisible();
        await scan(page);
      });

      test('resume page with the "?" help open', async ({ page }) => {
        await page.goto('/resume.html');
        await page.getByRole('button', { name: 'What does a QA engineer do?' }).click();
        await expect(page.locator('#qa-help')).toBeVisible();
        await scan(page);
      });

      test('resume page', async ({ page }) => {
        await page.goto('/resume.html');
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await scan(page);
      });
    });
  }
}

test.describe('axe: a toggled theme is also accessible (not only the system default)', () => {
  test.use({ colorScheme: 'light', reducedMotion: 'reduce' });

  test('home page after switching light to dark', async ({ page }) => {
    await page.goto('/');
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await scan(page);
  });
});

test.describe('axe canary: proves the scanner really catches problems', () => {
  test('flags low contrast and a missing image description in a deliberately bad page', async ({ page }) => {
    await page.setContent(`<!doctype html><html lang="en"><head><title>Bad</title></head><body>
      <main><h1>Bad page</h1>
      <p style="color:#cccccc;background:#ffffff">Very low contrast text</p>
      <img src="x.png">
      <button></button></main></body></html>`);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const ids = results.violations.map((v) => v.id);
    expect(ids).toEqual(expect.arrayContaining(['color-contrast', 'image-alt', 'button-name']));
  });
});
