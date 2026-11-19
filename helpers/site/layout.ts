import { Page } from '@playwright/test';

/**
 * Measures how far the page is wider than the window.
 *
 * @param page - The page to measure.
 * @returns Horizontal overflow in CSS pixels; 0 or less means nothing scrolls sideways.
 */
export async function horizontalOverflow(page: Page): Promise<number> {
    return page.evaluate(
        () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
    );
}
