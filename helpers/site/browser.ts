import { Locator, Page } from '@playwright/test';
import { ThemeStorage } from '../../enums/site/theme';

/**
 * Reads the theme the page is currently using (`data-theme` on the root element).
 *
 * @param page - The page to read.
 * @returns The theme name, or null when the page has not set one yet.
 */
export async function documentTheme(page: Page): Promise<string | null> {
    return page.evaluate(() =>
        document.documentElement.getAttribute('data-theme')
    );
}

/**
 * Reads the address-bar colour the page asks for (`theme-color` meta tag).
 *
 * @param page - The page to read.
 * @returns The colour, or null when the tag is missing.
 */
export async function themeColorMeta(page: Page): Promise<string | null> {
    return page.evaluate(
        () =>
            document
                .querySelector('meta[name="theme-color"]')
                ?.getAttribute('content') ?? null
    );
}

/**
 * Reads the theme the visitor saved in the browser.
 *
 * @param page - The page to read.
 * @returns The saved theme, or null when nothing is saved.
 */
export async function storedTheme(page: Page): Promise<string | null> {
    return page.evaluate(
        (key) => window.localStorage.getItem(key),
        ThemeStorage.KEY
    );
}

/**
 * Saves a theme choice before any page script runs, as if the visitor had
 * chosen it on an earlier visit.
 *
 * @param page - The page to prepare.
 * @param theme - The theme to save.
 */
export async function seedStoredTheme(
    page: Page,
    theme: string
): Promise<void> {
    await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key, value),
        [ThemeStorage.KEY, theme] as const
    );
}

/**
 * Makes `localStorage` throw on access, as in some private-browsing modes.
 *
 * @param page - The page to prepare.
 */
export async function blockLocalStorage(page: Page): Promise<void> {
    await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
            get() {
                throw new Error('blocked');
            },
        });
    });
}

/**
 * Waits until the page's first inline script has set a theme, which proves the
 * theme is applied before the first paint.
 *
 * @param page - The page to wait on.
 */
export async function waitForThemeAttribute(page: Page): Promise<void> {
    await page.waitForFunction(() =>
        document.documentElement.hasAttribute('data-theme')
    );
}

/**
 * Reads one computed CSS property of an element, as the browser resolved it.
 *
 * @param locator - The element to read.
 * @param property - A CSS property name, e.g. `fill` or `color`.
 * @returns The computed value.
 */
export async function computedStyle(
    locator: Locator,
    property: string
): Promise<string> {
    return locator.evaluate(
        (element, prop) => getComputedStyle(element).getPropertyValue(prop),
        property
    );
}

/**
 * Reads a computed CSS property of the first drawn shape inside an SVG icon.
 *
 * @param icon - The SVG element.
 * @param property - A CSS property name, e.g. `fill`.
 * @returns The computed value of its first path.
 */
export async function iconShapeStyle(
    icon: Locator,
    property: string
): Promise<string> {
    return icon.evaluate((svg, prop) => {
        const shape = svg.querySelector('path, rect, circle');
        return shape ? getComputedStyle(shape).getPropertyValue(prop) : '';
    }, property);
}

/**
 * Starts listening for console errors, uncaught page errors and failed requests.
 *
 * @param page - The page to watch.
 * @returns A live list that fills with a description of each problem.
 */
export function collectPageProblems(page: Page): string[] {
    const problems: string[] = [];
    page.on('console', (message) => {
        if (message.type() === 'error') problems.push(message.text());
    });
    page.on('pageerror', (error) => problems.push(String(error)));
    page.on('requestfailed', (request) =>
        problems.push(`failed: ${request.url()}`)
    );
    return problems;
}

/**
 * Starts listening for uncaught page errors only.
 *
 * @param page - The page to watch.
 * @returns A live list that fills with a description of each error.
 */
export function collectPageErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    return errors;
}
