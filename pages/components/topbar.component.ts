import { Locator, Page } from '@playwright/test';
import { LanguageCodes, ThemeLabels } from '../../enums/site/site';
import { AskUi } from '../../enums/site/ask';

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

    get switchToDarkButton(): Locator {
        return this.page.getByRole('button', { name: ThemeLabels.TO_DARK });
    }

    get switchToLightButton(): Locator {
        return this.page.getByRole('button', { name: ThemeLabels.TO_LIGHT });
    }

    // ==================== Actions ====================

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
}
