// The "?" next to "QA Engineer": a short explanation of the role. It opens only when clicked (or activated by keyboard).
const { test, expect } = require('@playwright/test');

const PAGES = ['/', '/resume.html'];
const NAME = 'What does a QA engineer do?';

const help = (page) => page.getByRole('button', { name: NAME });
const pop = (page) => page.locator('#qa-help');

for (const path of PAGES) {
    test.describe(`"?" help on ${path}`, () => {
        test.use({ colorScheme: 'light' });

        test.beforeEach(async ({ page }) => {
            await page.goto(path);
        });

        test('a "?" button sits right next to "QA Engineer", centred on the same line', async ({
            page,
        }) => {
            await expect(help(page)).toBeVisible();
            await expect(help(page)).toHaveText('?');
            const role = await page.locator('.role-line > .role').boundingBox();
            const btn = await help(page).boundingBox();
            expect(btn.x).toBeGreaterThanOrEqual(role.x + role.width); // to the right of the text
            expect(btn.x - (role.x + role.width)).toBeLessThan(24); // and close to it
            expect(
                Math.abs(btn.y + btn.height / 2 - (role.y + role.height / 2))
            ).toBeLessThan(6); // same line
            expect(btn.width).toBeGreaterThanOrEqual(24); // big enough to tap
            expect(btn.height).toBeGreaterThanOrEqual(24);
        });

        test('is closed at first, with the right accessibility state', async ({
            page,
        }) => {
            await expect(pop(page)).toBeHidden();
            await expect(help(page)).toHaveAttribute('aria-expanded', 'false');
            await expect(help(page)).toHaveAttribute(
                'aria-controls',
                'qa-help'
            );
        });

        test('a click opens a short summary of what a QA engineer does', async ({
            page,
        }) => {
            await help(page).click();
            await expect(pop(page)).toBeVisible();
            await expect(help(page)).toHaveAttribute('aria-expanded', 'true');
            await expect(pop(page).locator('.help-title')).toHaveText(NAME);
            await expect(pop(page)).toContainText('quality assurance');
            await expect(pop(page)).toContainText(
                'acceptance criteria and test cases'
            );
            await expect(pop(page)).toContainText(
                'test by hand and with automation'
            );
            await expect(pop(page)).toContainText('bugs');
            await expect(pop(page)).toContainText(
                'developers, designers and product owners'
            );
            await expect(pop(page).locator('li')).toHaveCount(4);
        });

        test('hovering alone does NOT open it', async ({ page }) => {
            await help(page).hover();
            await page.waitForTimeout(600);
            await expect(pop(page)).toBeHidden();
            await expect(help(page)).toHaveAttribute('aria-expanded', 'false');
            // moving the pointer over the area where the box would be does not open it either
            await page.mouse.move(120, 330, { steps: 6 });
            await page.waitForTimeout(300);
            await expect(pop(page)).toBeHidden();
        });

        test('the button still reacts to hover visually (accent colour) without opening anything', async ({
            page,
        }) => {
            await help(page).hover();
            await expect(help(page)).toHaveCSS(
                'background-color',
                'rgb(59, 91, 134)'
            );
            await expect(pop(page)).toBeHidden();
        });

        test('it stays open when the pointer leaves; a second click closes it', async ({
            page,
        }) => {
            await help(page).click();
            await expect(pop(page)).toBeVisible();
            await page.mouse.move(5, 650);
            await page.waitForTimeout(500);
            await expect(pop(page)).toBeVisible();
            await expect(help(page)).toHaveAttribute('aria-expanded', 'true');
            await help(page).click();
            await expect(pop(page)).toBeHidden();
            await expect(help(page)).toHaveAttribute('aria-expanded', 'false');
        });

        test('Escape closes it (dismissible)', async ({ page }) => {
            await help(page).click();
            await expect(pop(page)).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(pop(page)).toBeHidden();
        });

        test('clicking anywhere else closes it', async ({ page }) => {
            await help(page).click();
            await expect(pop(page)).toBeVisible();
            await page.mouse.click(5, 650);
            await expect(pop(page)).toBeHidden();
        });

        test('works from the keyboard: Tab to it, Enter opens, Escape closes and keeps focus on the button', async ({
            page,
        }) => {
            await help(page).focus();
            await page.keyboard.press('Enter');
            await expect(pop(page)).toBeVisible();
            await expect(help(page)).toHaveAttribute('aria-expanded', 'true');
            await page.keyboard.press('Escape');
            await expect(pop(page)).toBeHidden();
            await expect(help(page)).toBeFocused();
            await page.keyboard.press('Space');
            await expect(pop(page)).toBeVisible();
        });

        test('the box stays on screen and does not cover the name above it', async ({
            page,
        }) => {
            await help(page).click();
            const box = await pop(page).boundingBox();
            const name = await page
                .getByRole('heading', { level: 1 })
                .boundingBox();
            const vw = page.viewportSize().width;
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(vw);
            expect(box.y).toBeGreaterThan(name.y + name.height); // opens below, never over the heading
        });

        test('it is part of the page flow only visually: opening it does not move anything', async ({
            page,
        }) => {
            const before = await page
                .getByRole('heading', { level: 1 })
                .boundingBox();
            const roleBefore = await page
                .locator('.role-line > .role')
                .boundingBox();
            await help(page).click();
            const after = await page
                .getByRole('heading', { level: 1 })
                .boundingBox();
            const roleAfter = await page
                .locator('.role-line > .role')
                .boundingBox();
            expect(after).toEqual(before);
            expect(roleAfter).toEqual(roleBefore);
        });

        test('in print the help is not shown, even when it is open', async ({
            page,
        }) => {
            await help(page).click();
            await page.emulateMedia({ media: 'print' });
            await expect(help(page)).toBeHidden();
            await expect(pop(page)).toBeHidden();
        });
    });
}

test.describe('"?" help: themes, phone, no JavaScript', () => {
    test('light and dark themes use the page colours (solid box, readable text)', async ({
        browser,
    }) => {
        for (const [scheme, bg, ink] of [
            ['light', 'rgb(255, 255, 255)', 'rgb(17, 17, 17)'],
            ['dark', 'rgb(15, 17, 21)', 'rgb(242, 242, 242)'],
        ]) {
            const ctx = await browser.newContext({ colorScheme: scheme });
            const page = await ctx.newPage();
            await page.goto('/');
            await help(page).click();
            await expect(pop(page)).toHaveCSS('background-color', bg);
            await expect(pop(page)).toHaveCSS('color', ink);
            await ctx.close();
        }
    });

    test('open state highlights the button with the accent colour', async ({
        page,
    }) => {
        await page.goto('/');
        await help(page).click();
        await page.mouse.move(5, 650);
        await expect(help(page)).toHaveCSS(
            'background-color',
            'rgb(59, 91, 134)'
        );
    });

    test('on a phone: a tap opens it, it fits the screen, and a tap elsewhere closes it', async ({
        browser,
    }) => {
        const ctx = await browser.newContext({
            viewport: { width: 390, height: 844 },
            hasTouch: true,
            colorScheme: 'light',
        });
        const page = await ctx.newPage();
        await page.goto('/');
        await help(page).tap();
        await expect(pop(page)).toBeVisible();
        const box = await pop(page).boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(390);
        const overflow = await page.evaluate(
            () =>
                document.documentElement.scrollWidth -
                document.documentElement.clientWidth
        );
        expect(overflow).toBeLessThanOrEqual(0);
        await page.getByRole('heading', { level: 1 }).tap();
        await expect(pop(page)).toBeHidden();
        await ctx.close();
    });

    test('without JavaScript the "?" is not shown (it could not do anything) and the page still works', async ({
        browser,
    }) => {
        const ctx = await browser.newContext({
            javaScriptEnabled: false,
            colorScheme: 'light',
        });
        const page = await ctx.newPage();
        await page.goto('/');
        await expect(page.locator('button.help')).toBeHidden();
        await expect(
            page.getByText('QA Engineer', { exact: true })
        ).toBeVisible();
        await ctx.close();
    });

    test('the help does not break the existing tagline checks', async ({
        page,
    }) => {
        await page.goto('/');
        await expect(
            page.getByText('QA Engineer', { exact: true })
        ).toBeVisible();
        await expect(page.locator('.role')).toHaveText('QA Engineer');
    });
});
