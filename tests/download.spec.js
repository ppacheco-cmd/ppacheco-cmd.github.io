// Clicking a CV button: the file downloads (and nothing else happens: no redirect, no new tab),
// and the button visibly confirms the click for a few seconds.
const { test, expect } = require('@playwright/test');

const CASES = [
  { path: '/', idle: 'Download CV (PDF)' },
  { path: '/resume.html', idle: 'Download PDF' },
];
const DONE = 'Download started';

const btn = (page, idle) => page.getByRole('link', { name: idle, exact: true });
const doneBtn = (page) => page.getByRole('link', { name: DONE, exact: true });

for (const { path, idle } of CASES) {
  test.describe(`CV button on ${path}`, () => {
    test.use({ colorScheme: 'light' });

    test('downloads the file, and nothing else happens: no new tab, no redirect', async ({ page, context }) => {
      await page.goto(path);
      const before = { url: page.url(), tabs: context.pages().length };
      const [download] = await Promise.all([page.waitForEvent('download'), btn(page, idle).click()]);
      expect(download.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
      await page.waitForTimeout(800);
      expect(context.pages().length).toBe(before.tabs);
      expect(page.url()).toBe(before.url);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Paulo Pacheco');
    });

    test('the page never calls window.open', async ({ page }) => {
      await page.addInitScript(() => {
        window.__opens = 0;
        const real = window.open;
        window.open = (...a) => { window.__opens++; return real.apply(window, a); };
      });
      await page.goto(path);
      await btn(page, idle).click();
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => window.__opens)).toBe(0);
    });

    test('the link has no target, so the browser keeps the visitor on this tab', async ({ page }) => {
      await page.goto(path);
      const link = btn(page, idle);
      await expect(link).not.toHaveAttribute('target', /.*/);
      await expect(link).toHaveAttribute('download', 'PauloPacheco_CV.pdf');
      await expect(link).toHaveAttribute('href', 'cv/PauloPacheco_CV.pdf');
    });

    test('shows "Download started" with a check mark right after the click', async ({ page }) => {
      await page.goto(path);
      const link = btn(page, idle);
      await expect(link).toHaveAttribute('data-state', 'idle');
      await expect(page.locator('.cv-ico-idle')).toBeVisible();
      await expect(page.locator('.cv-ico-done')).toBeHidden();

      await link.click();
      const done = page.locator('.cv-btn');
      await expect(done).toHaveAttribute('data-state', 'done');
      await expect(doneBtn(page)).toBeVisible();
      await expect(page.locator('.cv-ico-done')).toBeVisible();
      await expect(page.locator('.cv-ico-idle')).toBeHidden();
      await expect(page.getByRole('link', { name: idle, exact: true })).toHaveCount(0);
      // success colour (light theme)
      await expect(done).toHaveCSS('background-color', 'rgb(31, 122, 77)');
    });

    test('goes back to the normal button after a few seconds', async ({ page }) => {
      await page.goto(path);
      await btn(page, idle).click();
      await expect(doneBtn(page)).toBeVisible();
      await expect(btn(page, idle)).toBeVisible({ timeout: 6000 });
      await expect(page.locator('.cv-btn')).toHaveAttribute('data-state', 'idle');
      await page.mouse.move(2, 400); // the pointer is still resting on the button after the click; move it away
      await expect(page.locator('.cv-btn')).toHaveCSS('background-color', 'rgb(59, 91, 134)');
      await expect(page.locator('#cv-status')).toHaveText('');
    });

    test('the button keeps exactly the same size, so nothing around it jumps', async ({ page }) => {
      await page.goto(path);
      const link = btn(page, idle);
      const idleBox = await link.boundingBox();
      const neighbour = path === '/' ? page.getByRole('link', { name: 'GitHub', exact: true }) : page.locator('.r-contact');
      const neighbourBox = await neighbour.boundingBox();
      await link.click();
      await expect(doneBtn(page)).toBeVisible();
      const doneBox = await doneBtn(page).boundingBox();
      expect(Math.abs(doneBox.width - idleBox.width)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(doneBox.height - idleBox.height)).toBeLessThanOrEqual(0.5);
      const neighbourAfter = await neighbour.boundingBox();
      expect(neighbourAfter.x).toBeCloseTo(neighbourBox.x, 0);
      expect(neighbourAfter.y).toBeCloseTo(neighbourBox.y, 0);
    });

    test('clicking again downloads again and restarts the confirmation', async ({ page }) => {
      await page.goto(path);
      const [d1] = await Promise.all([page.waitForEvent('download'), btn(page, idle).click()]);
      await expect(doneBtn(page)).toBeVisible();
      await page.waitForTimeout(2000);
      const [d2] = await Promise.all([page.waitForEvent('download'), doneBtn(page).click()]);
      expect(d1.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
      expect(d2.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
      // the timer restarted: still confirming ~2s after the second click (it would have ended at 3.5s after the first)
      await page.waitForTimeout(2000);
      await expect(page.locator('.cv-btn')).toHaveAttribute('data-state', 'done');
    });

    test('works from the keyboard (Enter) and keeps keyboard focus on the button', async ({ page }) => {
      await page.goto(path);
      await btn(page, idle).focus();
      const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')]);
      expect(download.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
      await expect(doneBtn(page)).toBeFocused();
    });

    test('screen readers are told the download started (polite live region)', async ({ page }) => {
      await page.goto(path);
      const status = page.locator('#cv-status');
      await expect(status).toHaveAttribute('role', 'status');
      await expect(status).toHaveAttribute('aria-live', 'polite');
      await expect(status).toHaveText('');
      await btn(page, idle).click();
      await expect(status).toHaveText('Download started: PauloPacheco_CV.pdf');
    });

    test('the accessible name always matches what is visible on the button', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('.cv-btn')).toHaveAccessibleName(idle);
      await btn(page, idle).click();
      await expect(page.locator('.cv-btn')).toHaveAccessibleName(DONE);
    });

    test('with JavaScript off the button still downloads the file', async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'light' });
      const page = await ctx.newPage();
      await page.goto(path);
      const [download] = await Promise.all([page.waitForEvent('download'), btn(page, idle).click()]);
      expect(download.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
      expect(ctx.pages().length).toBe(1);
      await ctx.close();
    });
  });
}

test.describe('CV button: themes and motion', () => {
  test('dark theme uses the light-green success colour with dark text', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    const page = await ctx.newPage();
    await page.goto('/');
    await btn(page, 'Download CV (PDF)').click();
    const done = page.locator('.cv-btn');
    await expect(done).toHaveAttribute('data-state', 'done');
    await expect(done).toHaveCSS('background-color', 'rgb(127, 209, 163)');
    await expect(done).toHaveCSS('color', 'rgb(15, 17, 21)');
    await ctx.close();
  });

  test('the confirmation does not stay on hover (hover on the done state keeps the success colour)', async ({ page }) => {
    await page.goto('/');
    await btn(page, 'Download CV (PDF)').click();
    await page.locator('.cv-btn').hover();
    await expect(page.locator('.cv-btn')).toHaveCSS('background-color', 'rgb(31, 122, 77)');
  });

  test('the check mark pops in; with reduced motion it just appears', async ({ browser }) => {
    for (const [reducedMotion, expected] of [['no-preference', 'confirm-pop'], ['reduce', 'none']]) {
      const ctx = await browser.newContext({ reducedMotion, colorScheme: 'light' });
      const page = await ctx.newPage();
      await page.goto('/');
      await btn(page, 'Download CV (PDF)').click();
      await expect(page.locator('.cv-ico-done')).toHaveCSS('animation-name', expected);
      await expect(doneBtn(page)).toBeVisible(); // the confirmation itself is always shown
      await ctx.close();
    }
  });
});

test.describe('CV button: scope', () => {
  test('only the CV button has the confirmation; GitHub and other links are untouched', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[data-cv-link]')).toHaveCount(1);
    const gh = page.getByRole('link', { name: 'GitHub', exact: true });
    await expect(gh).not.toHaveAttribute('data-state', /.*/);
    await gh.hover();
    await expect(gh).toHaveAttribute('target', '_blank'); // external links still open in their own tab
  });
});
