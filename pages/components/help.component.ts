import { Locator, Page, expect } from '@playwright/test';
import {
    HelpCounts,
    HelpGeometry,
    HelpText,
    TestIds,
} from '../../enums/site/help';

/**
 * Component Object for the "?" button next to "QA Engineer" and the panel it
 * opens. The same fragment exists on the home and resume pages.
 */
export class HelpComponent {
    constructor(private readonly page: Page) {}

    // ==================== Locators ====================

    get helpButton(): Locator {
        return this.page.getByRole('button', { name: HelpText.BUTTON });
    }

    panelTitleNamed(name: string): Locator {
        return this.panel.getByText(name, { exact: true });
    }

    buttonNamed(name: string): Locator {
        return this.page.getByRole('button', { name });
    }

    get openHelpButton(): Locator {
        return this.page.getByRole('button', {
            name: HelpText.BUTTON,
            expanded: true,
        });
    }

    get closedHelpButton(): Locator {
        return this.page.getByRole('button', {
            name: HelpText.BUTTON,
            expanded: false,
        });
    }

    get panel(): Locator {
        return this.page.getByTestId(TestIds.QA_HELP);
    }

    get panelTitle(): Locator {
        return this.panel.getByText(HelpText.BUTTON, { exact: true });
    }

    get panelItems(): Locator {
        return this.panel.getByRole('listitem');
    }

    get roleLabel(): Locator {
        return this.page.getByTestId(TestIds.ROLE);
    }

    get nameHeading(): Locator {
        return this.page.getByRole('heading', { level: 1 });
    }

    // ==================== Actions ====================

    /**
     * Clicks the "?" button, which opens the panel or closes it again.
     *
     * @returns {Promise<void>}
     */
    async toggle(): Promise<void> {
        await this.helpButton.click();
    }

    /**
     * Taps the "?" button (touch devices).
     *
     * @returns {Promise<void>}
     */
    async tap(): Promise<void> {
        await this.helpButton.tap();
    }

    /**
     * Moves the pointer over the "?" button without clicking.
     *
     * @returns {Promise<void>}
     */
    async hover(): Promise<void> {
        await this.helpButton.hover();
    }

    /**
     * Moves the pointer away from the button, onto the page heading.
     *
     * @returns {Promise<void>}
     */
    async moveAway(): Promise<void> {
        await this.nameHeading.hover();
    }

    /**
     * Clicks the page heading, which is "somewhere else" for the panel.
     *
     * @returns {Promise<void>}
     */
    async clickElsewhere(): Promise<void> {
        await this.nameHeading.click();
    }

    /**
     * Taps the page heading (touch devices).
     *
     * @returns {Promise<void>}
     */
    async tapElsewhere(): Promise<void> {
        await this.nameHeading.tap();
    }

    /**
     * Gives keyboard focus to the "?" button.
     *
     * @returns {Promise<void>}
     */
    async focusButton(): Promise<void> {
        await this.helpButton.focus();
    }

    /**
     * Presses a key while the focus is where it currently is.
     *
     * @param {string} key - A Playwright key name, e.g. `Enter`, `Space`, `Escape`.
     * @returns {Promise<void>}
     */
    async pressKey(key: string): Promise<void> {
        await this.page.keyboard.press(key);
    }

    // ==================== Verifications ====================

    /**
     * Verifies the "?" sits right after "QA Engineer", on the same line, and is
     * big enough to tap.
     *
     * @returns {Promise<void>}
     */
    async nextToRoleAndVerify(): Promise<void> {
        const role = await this.roleLabel.boundingBox();
        const button = await this.helpButton.boundingBox();
        expect(role).not.toBeNull();
        expect(button).not.toBeNull();
        if (!role || !button) return;
        const roleRight = role.x + role.width;
        expect(button.x).toBeGreaterThanOrEqual(roleRight);
        expect(button.x - roleRight).toBeLessThan(HelpGeometry.MAX_GAP);
        const centreOffset = Math.abs(
            button.y + button.height / 2 - (role.y + role.height / 2)
        );
        expect(centreOffset).toBeLessThan(HelpGeometry.MAX_VERTICAL_OFFSET);
        expect(button.width).toBeGreaterThanOrEqual(HelpGeometry.MIN_TAP_SIZE);
        expect(button.height).toBeGreaterThanOrEqual(HelpGeometry.MIN_TAP_SIZE);
    }

    /**
     * Verifies the open panel stays inside the viewport and opens below the
     * page heading, never over it.
     *
     * @returns {Promise<void>}
     */
    async panelOnScreenAndVerify(): Promise<void> {
        const box = await this.panel.boundingBox();
        const name = await this.nameHeading.boundingBox();
        const viewport = this.page.viewportSize();
        expect(box).not.toBeNull();
        expect(name).not.toBeNull();
        expect(viewport).not.toBeNull();
        if (!box || !name || !viewport) return;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.y).toBeGreaterThan(name.y + name.height);
    }

    /**
     * Verifies the summary content: title, key phrases and the number of bullets.
     *
     * @returns {Promise<void>}
     */
    async summaryContentAndVerify(): Promise<void> {
        await expect(this.panelTitle).toBeVisible();
        await expect(this.panel).toContainText(HelpText.INTRO);
        await expect(this.panel).toContainText(HelpText.ITEM_CRITERIA);
        await expect(this.panel).toContainText(HelpText.ITEM_AUTOMATION);
        await expect(this.panel).toContainText(HelpText.ITEM_BUGS);
        await expect(this.panel).toContainText(HelpText.ITEM_TEAM);
        await expect(this.panelItems).toHaveCount(HelpCounts.ITEMS);
    }

    /**
     * Opens the panel and verifies it did not move the heading or the role text.
     *
     * @returns {Promise<void>}
     */
    async openingMovesNothingAndVerify(): Promise<void> {
        const headingBefore = await this.nameHeading.boundingBox();
        const roleBefore = await this.roleLabel.boundingBox();
        await this.toggle();
        await expect(this.panel).toBeVisible();
        expect(await this.nameHeading.boundingBox()).toEqual(headingBefore);
        expect(await this.roleLabel.boundingBox()).toEqual(roleBefore);
    }
}
