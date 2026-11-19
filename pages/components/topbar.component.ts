import { Locator, Page, expect } from '@playwright/test';
import { LanguageCodes, ThemeLabels } from '../../enums/site/site';
import { AskUi } from '../../enums/site/ask';
import { IconTestIds, TopBarLayout } from '../../enums/site/theme';

/**
 * Component Object for the top bar shared by the home and resume pages:
 * brand link, main navigation, language switcher and theme toggle.
 */
export class TopBarComponent {
    constructor(private readonly page: Page) {}

    // ==================== Locators ====================

    get brandLink(): Locator {
        return this.page.getByRole('link', { name: /home/i });
    }

    get mainNavigation(): Locator {
        return this.page.getByRole('navigation', { name: 'Main' });
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

    get languageSelect(): Locator {
        return this.page.getByRole('combobox');
    }

    get themeToggle(): Locator {
        return this.page.getByRole('button', { name: /dark mode|light mode/i });
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
     * @param {LanguageCodes} code - The language to switch to.
     * @returns {Promise<void>}
     */
    async selectLanguage(code: LanguageCodes): Promise<void> {
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
