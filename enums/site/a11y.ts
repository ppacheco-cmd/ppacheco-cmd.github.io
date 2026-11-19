/**
 * Constants for the automated accessibility checks (axe-core).
 * Levels: WCAG 2.0, 2.1 and 2.2 A/AA plus axe best practices.
 */

/** The axe rule sets every page is checked against */
export const AxeRuleTags = [
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22aa',
    'best-practice',
] as const;

/** axe must evaluate at least this many rules, or the scan proves nothing */
export enum AxeLimits {
    MIN_PASSED_RULES = 15,
}

/** Viewports every page is scanned in */
export const A11yViewports = {
    desktop: { width: 1280, height: 720 },
    phone: { width: 390, height: 844 },
} as const;

/** Themes every page is scanned in */
export const A11yThemes = ['light', 'dark'] as const;

/** axe rule ids the canary page must trip */
export enum AxeRuleIds {
    CONTRAST = 'color-contrast',
    IMAGE_ALT = 'image-alt',
    BUTTON_NAME = 'button-name',
}

/** A deliberately inaccessible page: low contrast, an image without text, an unnamed button */
export const CANARY_PAGE_HTML = `<!doctype html><html lang="en"><head><title>Bad</title></head><body>
      <main><h1>Bad page</h1>
      <p style="color:#cccccc;background:#ffffff">Very low contrast text</p>
      <img src="x.png">
      <button></button></main></body></html>`;
