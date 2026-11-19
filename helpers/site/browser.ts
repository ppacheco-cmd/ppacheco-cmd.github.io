import { Locator, Page } from '@playwright/test';
import { SaveOnly } from '../../enums/site/cv';
import { LanguageStorage } from '../../enums/site/i18n';
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

/**
 * Counts every call to `window.open`, from before any page script runs, so a
 * test can prove a click never tried to open a new window.
 *
 * @param page - The page to prepare; call before navigating.
 */
export async function trackWindowOpen(page: Page): Promise<void> {
    await page.addInitScript(() => {
        const counter = window as unknown as { __opens: number };
        counter.__opens = 0;
        const original = window.open;
        window.open = (...args): Window | null => {
            counter.__opens += 1;
            return original.apply(window, args);
        };
    });
}

/**
 * Reads how many times `window.open` was called since {@link trackWindowOpen}.
 *
 * @param page - The page to read.
 * @returns The number of calls.
 */
export async function windowOpenCount(page: Page): Promise<number> {
    return page.evaluate(
        () => (window as unknown as { __opens: number }).__opens
    );
}

/**
 * Records the MIME type of every Blob the page turns into an object URL.
 *
 * @param page - The page to prepare; call before navigating.
 */
export async function trackBlobTypes(page: Page): Promise<void> {
    await page.addInitScript(() => {
        const holder = window as unknown as { __blobTypes: string[] };
        holder.__blobTypes = [];
        const real = URL.createObjectURL.bind(URL);
        URL.createObjectURL = (blob: Blob | MediaSource): string => {
            if (blob instanceof Blob) holder.__blobTypes.push(blob.type);
            return real(blob);
        };
    });
}

/**
 * Reads the Blob types recorded since {@link trackBlobTypes}.
 *
 * @param page - The page to read.
 * @returns One MIME type per Blob.
 */
export async function blobTypes(page: Page): Promise<string[]> {
    return page.evaluate(
        () => (window as unknown as { __blobTypes: string[] }).__blobTypes
    );
}

/**
 * Removes the browser's `fetch`, as in a very old or locked-down browser.
 *
 * @param page - The page to prepare; call before navigating.
 */
export async function removeFetch(page: Page): Promise<void> {
    await page.addInitScript(() => {
        (window as unknown as { fetch: undefined }).fetch = undefined;
    });
}

/**
 * Removes the `download` attribute from a link, simulating a browser that does
 * not honour it.
 *
 * @param link - The link to change.
 */
export async function removeDownloadAttribute(link: Locator): Promise<void> {
    await link.evaluate((anchor) => anchor.removeAttribute('download'));
}

/**
 * Fires a plain click and four modified clicks at a link, and reports for each
 * whether the page's handler took the click over (called preventDefault).
 *
 * @param link - The link to click.
 * @returns Whether each kind of click was taken over.
 */
export async function clickHandlingByModifier(
    link: Locator
): Promise<Record<'normal' | 'ctrl' | 'meta' | 'shift' | 'alt', boolean>> {
    return link.evaluate((anchor) => {
        const fire = (init: MouseEventInit): boolean => {
            const event = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                ...init,
            });
            anchor.dispatchEvent(event);
            return event.defaultPrevented;
        };
        return {
            normal: fire({}),
            ctrl: fire({ ctrlKey: true }),
            meta: fire({ metaKey: true }),
            shift: fire({ shiftKey: true }),
            alt: fire({ altKey: true }),
        };
    });
}

/**
 * Counts iframes, embeds and objects on the page, where a viewer would appear
 * if the PDF were displayed instead of saved.
 *
 * @param page - The page to inspect.
 * @returns The number of embedding elements.
 */
export async function embeddedViewerCount(page: Page): Promise<number> {
    return page.evaluate(
        () => document.querySelectorAll('iframe, embed, object').length
    );
}

/**
 * Holds back every request for the CV file until the returned function is
 * called, so a test can click before the background download has finished.
 *
 * @param page - The page whose requests to hold; call before navigating.
 * @returns A function that lets the held requests continue.
 */
export async function holdCvRequests(page: Page): Promise<() => void> {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
        release = resolve;
    });
    await page.route(`**/*${SaveOnly.PDF_SUFFIX}`, async (route) => {
        await gate;
        await route.continue();
    });
    return release;
}

/**
 * Reads the language code the page is showing (`data-lang` on the root element).
 *
 * @param page - The page to read.
 * @returns The code, or null when none is set.
 */
export async function documentDataLang(page: Page): Promise<string | null> {
    return page.evaluate(
        (attribute) => document.documentElement.getAttribute(attribute),
        LanguageStorage.DATA_ATTRIBUTE
    );
}

/**
 * Reads the document language tag (`lang` on the root element), e.g. `pt-PT`.
 *
 * @param page - The page to read.
 * @returns The tag, or null when none is set.
 */
export async function documentLangTag(page: Page): Promise<string | null> {
    return page.evaluate(() => document.documentElement.getAttribute('lang'));
}

/**
 * Reads the language the visitor saved in the browser.
 *
 * @param page - The page to read.
 * @returns The saved code, or null when nothing is saved.
 */
export async function storedLanguage(page: Page): Promise<string | null> {
    return page.evaluate(
        (key) => window.localStorage.getItem(key),
        LanguageStorage.KEY
    );
}

/**
 * Tells whether the page is still hidden while it waits for its translation.
 *
 * @param page - The page to read.
 * @returns True while the `data-pending-lang` marker is present.
 */
export async function isAwaitingTranslation(page: Page): Promise<boolean> {
    return page.evaluate(
        (attribute) => document.documentElement.hasAttribute(attribute),
        LanguageStorage.PENDING_ATTRIBUTE
    );
}

/**
 * Reads whether the page body is drawn (`visible`) or hidden.
 *
 * @param page - The page to read.
 * @returns The computed CSS `visibility` of the body.
 */
export async function bodyVisibility(page: Page): Promise<string> {
    return page.evaluate(() => getComputedStyle(document.body).visibility);
}

/**
 * Reads the page's meta description.
 *
 * @param page - The page to read.
 * @returns The description text, or null when there is none.
 */
export async function metaDescription(page: Page): Promise<string | null> {
    return page.evaluate(
        () =>
            document
                .querySelector('meta[name="description"]')
                ?.getAttribute('content') ?? null
    );
}

/**
 * Overrides the browser's preference list of languages before any page script runs.
 *
 * @param page - The page to prepare; call before navigating.
 * @param languages - The languages, most preferred first.
 */
export async function setNavigatorLanguages(
    page: Page,
    languages: readonly string[]
): Promise<void> {
    await page.addInitScript(
        (list) => {
            Object.defineProperty(navigator, 'languages', { get: () => list });
        },
        [...languages]
    );
}

/**
 * Counts how often the page's main frame navigates from now on.
 *
 * @param page - The page to watch.
 * @returns A function that returns the count so far.
 */
export function countNavigations(page: Page): () => number {
    let count = 0;
    page.on('framenavigated', () => {
        count += 1;
    });
    return () => count;
}

/**
 * Reads the bold and italic text inside an element.
 *
 * @param element - The element to read.
 * @returns The texts of its `strong` and `em` children.
 */
export async function emphasisIn(
    element: Locator
): Promise<{ strong: string[]; em: string[] }> {
    return element.evaluate((root) => ({
        strong: [...root.querySelectorAll('strong')].map(
            (node) => node.textContent ?? ''
        ),
        em: [...root.querySelectorAll('em')].map(
            (node) => node.textContent ?? ''
        ),
    }));
}

/**
 * Holds back every request matching a pattern until the returned function is called.
 *
 * @param page - The page whose requests to hold; call before navigating.
 * @param pattern - A glob such as `** /assets/i18n.js` (without the space).
 * @returns A function that lets the held requests continue.
 */
export async function holdRequestsMatching(
    page: Page,
    pattern: string
): Promise<() => void> {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
        release = resolve;
    });
    await page.route(pattern, async (route) => {
        await gate;
        await route.continue();
    });
    return release;
}

/**
 * Makes every request matching a pattern fail, as if the file could not be loaded.
 *
 * @param page - The page to prepare; call before navigating.
 * @param pattern - A glob of the files to fail.
 */
export async function abortRequestsMatching(
    page: Page,
    pattern: string
): Promise<void> {
    await page.route(pattern, (route) => route.abort());
}

/**
 * Reads the `lang` attribute and the value of every option of a select.
 *
 * @param select - The select element.
 * @returns The `lang` attributes and the values, in option order.
 */
export async function optionAttributes(
    select: Locator
): Promise<{ langs: Array<string | null>; values: string[] }> {
    return select.evaluate((element) => {
        const options = [...element.querySelectorAll('option')];
        return {
            langs: options.map((option) => option.getAttribute('lang')),
            values: options.map((option) => option.value),
        };
    });
}
