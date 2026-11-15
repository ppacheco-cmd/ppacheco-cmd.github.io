// The site uses one self-hosted font (Figtree, SIL OFL 1.1) so it looks the same on every device.
const { test, expect } = require('@playwright/test');

const PAGES = ['/', '/resume.html'];

async function loadedFonts(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((f) => f.status === 'loaded')
      .map((f) => `${f.family.replace(/"/g, '')}|${f.style}|${f.weight}`);
  });
}

test.describe('self-hosted font', () => {
  test.use({ colorScheme: 'light' });

  for (const path of PAGES) {
    test(`${path}: the regular Figtree font file loads and is used`, async ({ page }) => {
      await page.goto(path);
      expect(await loadedFonts(page)).toContain('Figtree|normal|300 900');
      const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
      expect(family.startsWith('Figtree')).toBe(true);
    });
  }

  test('the italic file loads on the resume page, where italics are used', async ({ page }) => {
    await page.goto('/resume.html');
    expect(await loadedFonts(page)).toContain('Figtree|italic|300 900');
  });

  test('text really renders in Figtree, not in a fallback font', async ({ page }) => {
    await page.goto('/');
    const widths = await page.evaluate(async () => {
      await document.fonts.ready;
      const probe = (font) => {
        const c = document.createElement('canvas').getContext('2d');
        c.font = font;
        return c.measureText('Paulo Pacheco, QA Engineer').width;
      };
      return { figtree: probe('700 40px Figtree'), arial: probe('700 40px Arial'), fake: probe('700 40px NoSuchFontXYZ') };
    });
    expect(widths.figtree).not.toBeCloseTo(widths.arial, 0);
    expect(widths.figtree).not.toBeCloseTo(widths.fake, 0);
  });

  test('heading and body use different weights of the same family', async ({ page }) => {
    await page.goto('/');
    const [h1, body] = await page.evaluate(() => [
      getComputedStyle(document.querySelector('h1')).fontWeight,
      getComputedStyle(document.body).fontWeight,
    ]);
    expect(Number(h1)).toBeGreaterThanOrEqual(700);
    expect(Number(body)).toBeLessThanOrEqual(500);
  });

  for (const path of PAGES) {
    test(`${path}: every request stays on this site (no Google Fonts or other third parties)`, async ({ page, baseURL }) => {
      const urls = [];
      page.on('request', (r) => { if (!r.url().startsWith('data:')) urls.push(r.url()); });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(urls.length).toBeGreaterThan(3);
      for (const u of urls) expect(u.startsWith(baseURL), u).toBe(true);
    });
  }

  test('font files are served as woff2 and stay small', async ({ request }) => {
    for (const f of ['figtree-latin-wght-normal.woff2', 'figtree-latin-wght-italic.woff2']) {
      const res = await request.get('/assets/fonts/' + f);
      expect(res.status(), f).toBe(200);
      expect(res.headers()['content-type'], f).toContain('font/woff2');
      expect((await res.body()).length, f).toBeLessThan(40_000);
    }
  });

  test('the font licence ships with the font', async ({ request }) => {
    const res = await request.get('/assets/fonts/Figtree-OFL.txt');
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('SIL OPEN FONT LICENSE');
    expect(text).toContain('Figtree Project Authors');
  });

  test('the home page preloads the font so text does not flash in another face', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="preload"][as="font"]')).toHaveAttribute('href', /figtree-latin-wght-normal\.woff2$/);
    await expect(page.locator('link[rel="preload"][as="font"]')).toHaveAttribute('crossorigin', '');
  });
});

test.describe('guard: all visible text can be set in Figtree', () => {
  // The font is a latin subset. If new text ever uses a character outside the declared
  // unicode-range (for example an arrow or an emoji), the browser would silently use a
  // different font for it. This test fails first.
  test('every character on both pages, and in the question answers, is inside the font range', async ({ page, request }) => {
    const css = await (await request.get('/assets/site.css')).text();
    const ranges = css
      .match(/unicode-range:\s*([^;]+);/)[1]
      .split(',')
      .map((r) => r.trim().replace('U+', '').split('-').map((h) => parseInt(h, 16)))
      .map(([a, b]) => [a, b ?? a]);
    const inRange = (cp) => ranges.some(([a, b]) => cp >= a && cp <= b);

    const texts = [];
    await page.goto('/');
    texts.push(await page.evaluate(() => {
      const qa = JSON.parse(document.getElementById('qa-data').textContent);
      return document.body.innerText + ' ' + qa.map((i) => i.q + ' ' + i.a).join(' ');
    }));
    await page.goto('/resume.html');
    texts.push(await page.evaluate(() => document.body.innerText));

    const bad = new Set();
    for (const t of texts) for (const ch of t) { if (!/\s/.test(ch) && !inRange(ch.codePointAt(0))) bad.add(ch); }
    expect([...bad], 'characters outside the Figtree latin range').toEqual([]);
  });
});
