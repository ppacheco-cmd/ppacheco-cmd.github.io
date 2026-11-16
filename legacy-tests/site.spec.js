const fs = require('fs');
const { test, expect } = require('@playwright/test');

const LIGHT_BG = 'rgb(255, 255, 255)';
const DARK_BG = 'rgb(15, 17, 21)';

const html = (page) => page.locator('html');
const toggle = (page) => page.locator('#theme-toggle');
const meta = (page) => page.locator('#theme-color');

test.describe('content and links', () => {
    test.use({ colorScheme: 'light' });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('page title, name and tagline', async ({ page }) => {
        await expect(page).toHaveTitle('Paulo Pacheco');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
            'Paulo Pacheco'
        );
        await expect(
            page.getByText('QA Engineer', { exact: true })
        ).toBeVisible();
    });

    test('top bar is present and sticky with brand and toggle', async ({
        page,
    }) => {
        const bar = page.locator('header.topbar');
        await expect(bar).toBeVisible();
        await expect(bar).toHaveCSS('position', 'sticky');
        await expect(
            bar.getByRole('link', { name: /Paulo Pacheco/ })
        ).toHaveText('PP');
        await expect(toggle(page)).toBeVisible();
    });

    test('the top bar spans the screen: badge at the left edge, nav and toggle at the right edge', async ({
        page,
    }) => {
        for (const width of [1280, 1920]) {
            await page.setViewportSize({ width, height: 800 });
            const brand = await page.locator('.brand').boundingBox();
            const tog = await page.locator('#theme-toggle').boundingBox();
            expect(
                brand.x,
                `badge near the left edge at ${width}px`
            ).toBeGreaterThanOrEqual(16);
            expect(
                brand.x,
                `badge near the left edge at ${width}px`
            ).toBeLessThanOrEqual(32);
            // the icon inside the 40px toggle box should sit about 24px from the right edge
            const iconRight = tog.x + tog.width / 2 + 10;
            expect(
                width - iconRight,
                `toggle icon near the right edge at ${width}px`
            ).toBeGreaterThanOrEqual(16);
            expect(
                width - iconRight,
                `toggle icon near the right edge at ${width}px`
            ).toBeLessThanOrEqual(32);
            // nav links sit between the badge and the toggle, left of the toggle
            const nav = await page.locator('.topnav').boundingBox();
            expect(nav.x).toBeGreaterThan(brand.x + brand.width);
            expect(nav.x + nav.width).toBeLessThanOrEqual(tog.x);
        }
    });

    test('the page content stays in its own centred column under the full-width bar', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1920, height: 900 });
        const name = await page
            .getByRole('heading', { level: 1 })
            .boundingBox();
        const brand = await page.locator('.brand').boundingBox();
        expect(name.x).toBeGreaterThan(brand.x + 200); // content is not dragged to the screen edge
        expect(name.x).toBeLessThan(1920 / 2);
    });

    test('Download CV, GitHub, LinkedIn and Email links are correct', async ({
        page,
    }) => {
        const cv = page.getByRole('link', { name: 'Download CV' });
        await expect(cv).toHaveAttribute('href', 'cv/PauloPacheco_CV.pdf');
        await expect(cv).toHaveAttribute('download', 'PauloPacheco_CV.pdf');

        const gh = page.getByRole('link', { name: 'GitHub' });
        await expect(gh).toHaveAttribute(
            'href',
            'https://github.com/ppacheco-cmd'
        );
        await expect(gh).toHaveAttribute('target', '_blank');
        await expect(gh).toHaveAttribute('rel', /noopener/);

        const li = page.getByRole('link', { name: 'LinkedIn' });
        await expect(li).toHaveAttribute(
            'href',
            'https://www.linkedin.com/in/palexpacheco/'
        );
        await expect(li).toHaveAttribute('target', '_blank');
        await expect(li).toHaveAttribute('rel', /noopener/);

        await expect(page.getByRole('link', { name: 'Email' })).toHaveAttribute(
            'href',
            /^mailto:.+@.+/
        );
    });

    test('Download CV downloads a real PDF', async ({ page }) => {
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('link', { name: 'Download CV' }).click(),
        ]);
        expect(download.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
        const buf = fs.readFileSync(await download.path());
        expect(buf.length).toBeGreaterThan(10_000);
        expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
    });

    test('the cv/ folder holds exactly the one PDF the button links to (no stray or old versions)', async () => {
        const pdfs = fs
            .readdirSync('cv')
            .filter((f) => f.toLowerCase().endsWith('.pdf'));
        expect(pdfs).toEqual(['PauloPacheco_CV.pdf']);
    });

    test('the CV link target is served as a PDF', async ({ page, request }) => {
        await page.goto('/');
        const href = await page
            .getByRole('link', { name: 'Download CV' })
            .getAttribute('href');
        const res = await request.get('/' + href);
        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/pdf');
    });

    test('no console errors or failed requests', async ({ page }) => {
        const problems = [];
        page.on(
            'console',
            (m) => m.type() === 'error' && problems.push(m.text())
        );
        page.on('pageerror', (e) => problems.push(String(e)));
        page.on('requestfailed', (r) => problems.push('failed: ' + r.url()));
        await page.reload();
        await toggle(page).click();
        await toggle(page).click();
        expect(problems).toEqual([]);
    });
});

test.describe('theme: system default', () => {
    test('follows a light system setting', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'light' });
        const page = await ctx.newPage();
        await page.goto('/');
        await expect(html(page)).toHaveAttribute('data-theme', 'light');
        await expect(page.locator('body')).toHaveCSS(
            'background-color',
            LIGHT_BG
        );
        await expect(toggle(page)).toHaveAccessibleName('Switch to dark mode');
        await expect(meta(page)).toHaveAttribute('content', '#ffffff');
        await ctx.close();
    });

    test('follows a dark system setting', async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: 'dark' });
        const page = await ctx.newPage();
        await page.goto('/');
        await expect(html(page)).toHaveAttribute('data-theme', 'dark');
        await expect(page.locator('body')).toHaveCSS(
            'background-color',
            DARK_BG
        );
        await expect(toggle(page)).toHaveAccessibleName('Switch to light mode');
        await expect(meta(page)).toHaveAttribute('content', '#0f1115');
        await ctx.close();
    });

    test('live-follows system changes until the visitor chooses', async ({
        browser,
    }) => {
        const ctx = await browser.newContext({ colorScheme: 'light' });
        const page = await ctx.newPage();
        await page.goto('/');
        await expect(html(page)).toHaveAttribute('data-theme', 'light');

        await page.emulateMedia({ colorScheme: 'dark' });
        await expect(html(page)).toHaveAttribute('data-theme', 'dark');

        // an explicit choice now wins over later system changes
        await toggle(page).click();
        await expect(html(page)).toHaveAttribute('data-theme', 'light');
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.emulateMedia({ colorScheme: 'light' });
        await page.emulateMedia({ colorScheme: 'dark' });
        await expect(html(page)).toHaveAttribute('data-theme', 'light');
        await ctx.close();
    });
});

test.describe('theme toggle', () => {
    test.use({ colorScheme: 'light' });

    test('click switches theme, label, address-bar colour and background', async ({
        page,
    }) => {
        await page.goto('/');
        await toggle(page).click();
        await expect(html(page)).toHaveAttribute('data-theme', 'dark');
        await expect(page.locator('body')).toHaveCSS(
            'background-color',
            DARK_BG
        );
        await expect(toggle(page)).toHaveAccessibleName('Switch to light mode');
        await expect(meta(page)).toHaveAttribute('content', '#0f1115');

        await toggle(page).click();
        await expect(html(page)).toHaveAttribute('data-theme', 'light');
        await expect(page.locator('body')).toHaveCSS(
            'background-color',
            LIGHT_BG
        );
        await expect(toggle(page)).toHaveAccessibleName('Switch to dark mode');
        await expect(meta(page)).toHaveAttribute('content', '#ffffff');
    });

    test('shows the icon for the mode you will switch to', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.i-moon')).toBeVisible();
        await expect(page.locator('.i-sun')).toBeHidden();
        await toggle(page).click();
        await expect(page.locator('.i-sun')).toBeVisible();
        await expect(page.locator('.i-moon')).toBeHidden();
    });

    test('choice is saved and survives a reload, even against the system setting', async ({
        page,
    }) => {
        await page.goto('/');
        await toggle(page).click(); // light system -> dark chosen
        expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(
            'dark'
        );
        await page.reload();
        await expect(html(page)).toHaveAttribute('data-theme', 'dark');
        await expect(page.locator('body')).toHaveCSS(
            'background-color',
            DARK_BG
        );
        await expect(toggle(page)).toHaveAccessibleName('Switch to light mode');
    });

    test('no flash: the saved theme is applied before first paint', async ({
        page,
    }) => {
        await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
        await page.goto('/', { waitUntil: 'commit' });
        // as soon as the document exists, the inline script must already have set the theme
        await page.waitForFunction(() =>
            document.documentElement.hasAttribute('data-theme')
        );
        await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    });

    test('works with the keyboard (Tab order: brand, Resume, Ask, language, toggle; Enter switches)', async ({
        page,
    }) => {
        await page.goto('/');
        await page.keyboard.press('Tab');
        await expect(page.locator('.brand')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(
            page.locator('.topnav').getByRole('link', { name: 'Resume' })
        ).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(
            page.locator('.topnav').getByRole('link', { name: 'Ask' })
        ).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.locator('#lang-select')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(toggle(page)).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    });

    test('still works when localStorage is unavailable', async ({ page }) => {
        await page.addInitScript(() => {
            Object.defineProperty(window, 'localStorage', {
                get() {
                    throw new Error('blocked');
                },
            });
        });
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        await page.goto('/');
        await toggle(page).click();
        await expect(html(page)).toHaveAttribute('data-theme', 'dark');
        expect(errors).toEqual([]);
    });
});

test.describe('motion: no decorative entrance animation', () => {
    for (const reducedMotion of ['no-preference', 'reduce']) {
        test(`hero content is visible immediately and nothing animates on load (${reducedMotion})`, async ({
            browser,
        }) => {
            const ctx = await browser.newContext({ reducedMotion });
            const page = await ctx.newPage();
            await page.goto('/');
            for (const el of [
                page.getByRole('heading', { level: 1 }),
                page.locator('.role'),
                page.getByRole('link', { name: 'Download CV (PDF)' }),
            ]) {
                await expect(el).toHaveCSS('animation-name', 'none');
                await expect(el).toHaveCSS('opacity', '1');
            }
            await ctx.close();
        });
    }

    test('buttons change colour on hover but do not move', async ({ page }) => {
        await page.goto('/');
        const btn = page.getByRole('link', { name: 'Download CV (PDF)' });
        const before = await btn.boundingBox();
        await btn.hover();
        await page.waitForTimeout(250);
        const after = await btn.boundingBox();
        expect(after.y).toBe(before.y);
    });
});

test.describe('phone layout (390x844)', () => {
    test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });

    test('buttons stack full width and nothing overflows sideways', async ({
        page,
    }) => {
        await page.goto('/');
        const cv = await page
            .getByRole('link', { name: 'Download CV' })
            .boundingBox();
        const gh = await page
            .getByRole('link', { name: 'GitHub' })
            .boundingBox();
        expect(gh.y).toBeGreaterThan(cv.y + cv.height - 1); // stacked
        expect(Math.abs(cv.width - gh.width)).toBeLessThanOrEqual(1); // same width
        expect(cv.width).toBeGreaterThan(390 - 24 * 2 - 2); // full width of the content

        const overflow = await page.evaluate(
            () =>
                document.documentElement.scrollWidth -
                document.documentElement.clientWidth
        );
        expect(overflow).toBeLessThanOrEqual(0);
    });

    test('top bar and toggle stay usable on a phone', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.brand')).toBeVisible();
        await toggle(page).click();
        await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    });
});

test.describe('hero links have icons', () => {
    test.use({ colorScheme: 'light' });

    test('LinkedIn and Email each have a decorative icon to the left of their label', async ({
        page,
    }) => {
        await page.goto('/');
        for (const [name, kind] of [
            ['LinkedIn', 'ico-fill'],
            ['Email', 'ico-stroke'],
        ]) {
            const link = page
                .locator('.links')
                .getByRole('link', { name, exact: true });
            await expect(link).toBeVisible();
            const icon = link.locator('svg');
            await expect(icon).toHaveCount(1);
            await expect(icon).toHaveAttribute('aria-hidden', 'true');
            await expect(icon).toHaveClass(new RegExp(kind));
            const ib = await icon.boundingBox();
            const tb = await link.locator('span').boundingBox();
            expect(Math.round(ib.width)).toBe(18);
            expect(Math.round(ib.height)).toBe(18);
            expect(ib.x + ib.width).toBeLessThanOrEqual(tb.x); // icon is left of the text
            expect(
                Math.abs(ib.y + ib.height / 2 - (tb.y + tb.height / 2))
            ).toBeLessThan(4); // vertically centred with it
        }
    });

    test('the icons follow the text colour, including on hover', async ({
        page,
    }) => {
        await page.goto('/');
        const li = page
            .locator('.links')
            .getByRole('link', { name: 'LinkedIn', exact: true });
        const iconFill = () =>
            li
                .locator('svg path')
                .first()
                .evaluate((p) => getComputedStyle(p).fill);
        const textColor = () => li.evaluate((a) => getComputedStyle(a).color);
        expect(await iconFill()).toBe(await textColor());
        await li.hover();
        await expect(li).toHaveCSS('color', 'rgb(59, 91, 134)');
        expect(await iconFill()).toBe('rgb(59, 91, 134)');

        const mail = page
            .locator('.links')
            .getByRole('link', { name: 'Email', exact: true });
        const stroke = await mail
            .locator('svg')
            .evaluate((s) => getComputedStyle(s).stroke);
        expect(stroke).toBe(
            await mail.evaluate((a) => getComputedStyle(a).color)
        );
    });

    test('the links keep their plain accessible names and are big enough to tap', async ({
        page,
    }) => {
        await page.goto('/');
        await expect(
            page.getByRole('link', { name: 'LinkedIn', exact: true })
        ).toHaveAttribute('href', 'https://www.linkedin.com/in/palexpacheco/');
        await expect(
            page.getByRole('link', { name: 'Email', exact: true })
        ).toHaveAttribute('href', /^mailto:/);
        for (const link of await page.locator('.links a').all()) {
            const b = await link.boundingBox();
            expect(b.height).toBeGreaterThanOrEqual(24);
        }
    });
});
