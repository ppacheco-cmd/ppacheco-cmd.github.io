import { Locator, Page, expect } from '@playwright/test';
import { ThemeLabels } from '../../enums/site/site';
import { AskUi } from '../../enums/site/ask';
import { IconTestIds, TopBarLayout } from '../../enums/site/theme';
import { FitTolerance, I18nTestIds } from '../../enums/site/i18n';

/**
 * Component Object for the top bar shared by the home and resume pages:
 * brand link, main navigation, language switcher and theme toggle.
 */
export class TopBarComponent {
    constructor(private readonly page: Page) {}

    // ==================== Locators ====================

    get brandLink(): Locator {
        return this.page.getByTestId(I18nTestIds.BRAND);
    }

    get mainNavigation(): Locator {
        return this.page.getByRole('navigation');
    }

    get banner(): Locator {
        return this.page.getByRole('banner');
    }

    get resumeLink(): Locator {
        return this.mainNavigation.getByRole('link', {
            name: AskUi.RESUME_LINK,
        });
    }

    get askLink(): Locator {
        return this.mainNavigation.getByRole('link', {
            name: AskUi.ASK_LINK,
        });
    }

    navLinkNamed(name: string): Locator {
        return this.mainNavigation.getByRole('link', { name });
    }

    get languageSwitcher(): Locator {
        return this.page.getByTestId(I18nTestIds.SWITCHER);
    }

    get languageCode(): Locator {
        return this.page.getByTestId(I18nTestIds.CODE);
    }

    get navigationLinks(): Locator {
        return this.mainNavigation.getByRole('link');
    }

    get languageSelect(): Locator {
        return this.page.getByRole('combobox');
    }

    get themeToggle(): Locator {
        return this.page.getByTestId(I18nTestIds.THEME_TOGGLE);
    }

    get switchToDarkButton(): Locator {
        return this.page.getByRole('button', { name: ThemeLabels.TO_DARK });
    }

    get switchToLightButton(): Locator {
        return this.page.getByRole('button', { name: ThemeLabels.TO_LIGHT });
    }

    get moonIcon(): Locator {
        return this.page.getByTestId(IconTestIds.MOON);
    }

    get sunIcon(): Locator {
        return this.page.getByTestId(IconTestIds.SUN);
    }

    // ==================== Actions ====================

    /**
     * Clicks the brand badge, which leads back to the home page.
     *
     * @returns {Promise<void>}
     */
    async clickBrand(): Promise<void> {
        await this.brandLink.click();
    }

    /**
     * Follows the Resume link in the top bar.
     *
     * @returns {Promise<void>}
     */
    async clickResume(): Promise<void> {
        await this.resumeLink.click();
    }

    /**
     * Follows the Ask link in the top bar.
     *
     * @returns {Promise<void>}
     */
    async clickAsk(): Promise<void> {
        await this.askLink.click();
    }

    /**
     * Chooses a language in the language switcher.
     *
     * @param {string} code - The language code to switch to, e.g. `pt`.
     * @returns {Promise<void>}
     */
    async selectLanguage(code: string): Promise<void> {
        await this.languageSelect.selectOption(code);
    }

    /**
     * Switches from light to dark mode.
     *
     * @returns {Promise<void>}
     */
    async switchToDark(): Promise<void> {
        await this.switchToDarkButton.click();
    }

    /**
     * Switches from dark to light mode.
     *
     * @returns {Promise<void>}
     */
    async switchToLight(): Promise<void> {
        await this.switchToLightButton.click();
    }

    /**
     * Clicks the theme toggle, whichever way it currently switches.
     *
     * @returns {Promise<void>}
     */
    async clickToggle(): Promise<void> {
        await this.themeToggle.click();
    }

    /**
     * Presses a key while the focus is where it currently is.
     *
     * @param {string} key - A Playwright key name, e.g. `Tab` or `Enter`.
     * @returns {Promise<void>}
     */
    async pressKey(key: string): Promise<void> {
        await this.page.keyboard.press(key);
    }

    // ==================== Verifications ====================

    /**
     * Verifies the language switcher sits between the navigation links and the
     * theme toggle, and is tall enough to use.
     *
     * @returns {Promise<void>}
     */
    async switcherSitsBetweenNavAndToggleAndVerify(): Promise<void> {
        const nav = await this.mainNavigation.boundingBox();
        const switcher = await this.languageSwitcher.boundingBox();
        const toggle = await this.themeToggle.boundingBox();
        expect(nav).not.toBeNull();
        expect(switcher).not.toBeNull();
        expect(toggle).not.toBeNull();
        if (!nav || !switcher || !toggle) return;
        expect(switcher.x).toBeGreaterThanOrEqual(nav.x + nav.width);
        expect(switcher.x + switcher.width).toBeLessThanOrEqual(
            toggle.x + FitTolerance.SWITCHER_TO_TOGGLE
        );
        expect(switcher.height).toBeGreaterThanOrEqual(
            FitTolerance.MIN_SWITCHER_HEIGHT
        );
    }

    /**
     * Verifies the four parts of the bar (badge, navigation, language switcher,
     * toggle) all stay inside the screen width and do not overlap one another.
     *
     * @param {number} width - The viewport width being checked.
     * @returns {Promise<void>}
     */
    async fitsWithoutOverlapAndVerify(width: number): Promise<void> {
        const parts = [
            this.brandLink,
            this.mainNavigation,
            this.languageSwitcher,
            this.themeToggle,
        ];
        let previousRight = 0;
        for (const part of parts) {
            const box = await part.boundingBox();
            expect(box).not.toBeNull();
            if (!box) continue;
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(
                width + FitTolerance.RIGHT_EDGE
            );
            expect(previousRight).toBeLessThanOrEqual(
                box.x + FitTolerance.OVERLAP
            );
            previousRight = box.x + box.width;
        }
    }

    /**
     * Verifies the bar spans the screen: the badge near the left edge, the
     * toggle icon near the right edge, and the navigation between them.
     *
     * @param {number} width - The viewport width being checked.
     * @returns {Promise<void>}
     */
    async spansScreenAndVerify(width: number): Promise<void> {
        const brand = await this.brandLink.boundingBox();
        const toggle = await this.themeToggle.boundingBox();
        const nav = await this.mainNavigation.boundingBox();
        expect(brand).not.toBeNull();
        expect(toggle).not.toBeNull();
        expect(nav).not.toBeNull();
        if (!brand || !toggle || !nav) return;
        expect(brand.x).toBeGreaterThanOrEqual(TopBarLayout.EDGE_MIN);
        expect(brand.x).toBeLessThanOrEqual(TopBarLayout.EDGE_MAX);
        const iconRight =
            toggle.x + toggle.width / 2 + TopBarLayout.TOGGLE_ICON_HALF;
        expect(width - iconRight).toBeGreaterThanOrEqual(TopBarLayout.EDGE_MIN);
        expect(width - iconRight).toBeLessThanOrEqual(TopBarLayout.EDGE_MAX);
        expect(nav.x).toBeGreaterThan(brand.x + brand.width);
        expect(nav.x + nav.width).toBeLessThanOrEqual(toggle.x);
    }
}
