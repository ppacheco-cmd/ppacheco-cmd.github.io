// The CV must only ever be SAVED by the browser, never displayed in the page or in a viewer tab.
// A plain <a download> link depends on the browser honouring the attribute. These tests prove the
// button also works when it does not (the file is handed over as generic binary data, which
// a browser can only save).
const fs = require('fs');
const crypto = require('crypto');
const { test, expect } = require('@playwright/test');

const CASES = [
  { path: '/', idle: 'Download CV (PDF)' },
  { path: '/resume.html', idle: 'Download PDF' },
];
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

for (const { path, idle } of CASES) {
  test.describe(`save-only CV button on ${path}`, () => {
    test.use({ colorScheme: 'light' });

    const link = (page) => page.getByRole('link', { name: idle, exact: true });

    test('the file is prepared in the background right after the page loads', async ({ page }) => {
      await page.goto(path);
      await expect(link(page)).toHaveAttribute('data-ready', 'true', { timeout: 5000 });
    });

    test('click saves the real PDF, byte for byte, from a generic-binary download', async ({ page, request }) => {
      await page.goto(path);
      await expect(link(page)).toHaveAttribute('data-ready', 'true');
      const served = await (await request.get('/cv/PauloPacheco_CV.pdf')).body();

      const [download] = await Promise.all([page.waitForEvent('download'), link(page).click()]);
      expect(download.url().startsWith('blob:')).toBe(true);
      expect(download.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
      const saved = fs.readFileSync(await download.path());
      expect(saved.subarray(0, 5).toString()).toBe('%PDF-');
      expect(saved.length).toBe(served.length);
      expect(sha(saved)).toBe(sha(served));
    });

    test('the browser is told the data is generic binary (application/octet-stream), so it cannot display it', async ({ page }) => {
      await page.addInitScript(() => {
        window.__blobTypes = [];
        const real = URL.createObjectURL.bind(URL);
        URL.createObjectURL = (b) => { window.__blobTypes.push(b.type); return real(b); };
      });
      await page.goto(path);
      await expect(link(page)).toHaveAttribute('data-ready', 'true');
      expect(await page.evaluate(() => window.__blobTypes)).toEqual(['application/octet-stream']);
    });

    test('even if the browser ignores the download attribute, the file is still saved with the right name', async ({ page, context }) => {
      await page.goto(path);
      await expect(link(page)).toHaveAttribute('data-ready', 'true');
      await link(page).evaluate((a) => a.removeAttribute('download')); // simulate a browser that does not honour it
      const before = { url: page.url(), tabs: context.pages().length };
      const [download] = await Promise.all([page.waitForEvent('download'), link(page).click()]);
      expect(download.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
      await page.waitForTimeout(600);
      expect(page.url()).toBe(before.url);
      expect(context.pages().length).toBe(before.tabs);
    });

    test('the PDF is never embedded or displayed in the page', async ({ page }) => {
      await page.goto(path);
      await expect(link(page)).toHaveAttribute('data-ready', 'true');
      await Promise.all([page.waitForEvent('download'), link(page).click()]);
      await page.waitForTimeout(400);
      await expect(page.locator('iframe, embed, object')).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('if the file is not ready yet, the plain link still saves it', async ({ page, context }) => {
      // make the background fetch slow so the click arrives first
      await context.route('**/cv/PauloPacheco_CV.pdf', async (route) => {
        await new Promise((r) => setTimeout(r, 1200));
        await route.continue();
      });
      await page.goto(path);
      await expect(link(page)).not.toHaveAttribute('data-ready', 'true');
      const [download] = await Promise.all([page.waitForEvent('download'), link(page).click()]);
      expect(download.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
      expect(download.url().startsWith('blob:')).toBe(false); // the plain link did it
      await expect(page.locator('.cv-btn')).toHaveAttribute('data-state', 'done'); // feedback is still shown
    });

    test('if fetch is not available in the browser, the plain link still saves it and confirms', async ({ page }) => {
      await page.addInitScript(() => { window.fetch = undefined; });
      await page.goto(path);
      await expect(link(page)).not.toHaveAttribute('data-ready', 'true');
      const [download] = await Promise.all([page.waitForEvent('download'), link(page).click()]);
      expect(download.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
      await expect(page.locator('.cv-btn')).toHaveAttribute('data-state', 'done');
    });

    test('Ctrl/Cmd/Shift/Alt-click is left to the browser; a normal click is taken over', async ({ page }) => {
      await page.goto(path);
      await expect(link(page)).toHaveAttribute('data-ready', 'true');
      const result = await link(page).evaluate((a) => {
        const fire = (init) => { const ev = new MouseEvent('click', { bubbles: true, cancelable: true, ...init }); a.dispatchEvent(ev); return ev.defaultPrevented; };
        return { normal: fire({}), ctrl: fire({ ctrlKey: true }), meta: fire({ metaKey: true }), shift: fire({ shiftKey: true }), alt: fire({ altKey: true }) };
      });
      expect(result).toEqual({ normal: true, ctrl: false, meta: false, shift: false, alt: false });
    });

    test('works from the keyboard', async ({ page }) => {
      await page.goto(path);
      await expect(link(page)).toHaveAttribute('data-ready', 'true');
      await link(page).focus();
      const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')]);
      expect(download.url().startsWith('blob:')).toBe(true);
      expect(download.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
    });

    test('repeated clicks keep saving the file', async ({ page }) => {
      await page.goto(path);
      await expect(link(page)).toHaveAttribute('data-ready', 'true');
      const [d1] = await Promise.all([page.waitForEvent('download'), link(page).click()]);
      const second = page.getByRole('link', { name: 'Download started', exact: true });
      const [d2] = await Promise.all([page.waitForEvent('download'), second.click()]);
      expect(d1.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
      expect(d2.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
    });
  });
}

test.describe('save-only CV button: requests', () => {
  test('the background fetch is a single same-origin request for the CV', async ({ page, baseURL }) => {
    const pdfRequests = [];
    page.on('request', (r) => { if (r.url().endsWith('.pdf')) pdfRequests.push(r.url()); });
    await page.goto('/');
    await expect(page.locator('.cv-btn')).toHaveAttribute('data-ready', 'true');
    expect(pdfRequests).toEqual([baseURL + '/cv/PauloPacheco_CV.pdf']);
  });
});
