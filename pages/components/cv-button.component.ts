import { Download, Locator, Page, expect } from '@playwright/test';
import {
    CvButtonText,
    CvTestIds,
    CvTolerances,
    SaveOnly,
} from '../../enums/site/cv';

/**
 * Component Object for the CV download button. Its idle label differs between
 * the home page ("Download CV (PDF)") and the resume page ("Download PDF"),
 * so the label is passed in.
 */
export class CvButtonComponent {
    constructor(
        private readonly page: Page,
        private readonly idleName: string
    ) {}

    // ==================== Locators ====================

    get button(): Locator {
        return this.page.getByTestId(CvTestIds.BUTTON);
    }

    get idleLink(): Locator {
        return this.page.getByRole('link', {
            name: this.idleName,
            exact: true,
        });
    }

    get doneLink(): Locator {
        return this.page.getByRole('link', {
            name: CvButtonText.DONE,
            exact: true,
        });
    }

    get idleIcon(): Locator {
        return this.page.getByTestId(CvTestIds.ICON_IDLE);
    }

    get doneIcon(): Locator {
        return this.page.getByTestId(CvTestIds.ICON_DONE);
    }

    get status(): Locator {
        return this.page.getByRole('status');
    }

    // ==================== Actions ====================

    /**
     * Clicks the button.
     *
     * @returns {Promise<void>}
     */
    async click(): Promise<void> {
        await this.button.click();
    }

    /**
     * Moves the pointer over the button without clicking.
     *
     * @returns {Promise<void>}
     */
    async hover(): Promise<void> {
        await this.button.hover();
    }

    /**
     * Gives the button keyboard focus.
     *
     * @returns {Promise<void>}
     */
    async focus(): Promise<void> {
        await this.button.focus();
    }

    /**
     * Clicks the button and waits for the browser to start the download.
     *
     * @returns {Promise<Download>} The started download.
     */
    async clickAndWaitForDownload(): Promise<Download> {
        const download = this.page.waitForEvent('download');
        await this.button.click();
        return download;
    }

    /**
     * Presses Enter on the focused button and waits for the download to start.
     *
     * @returns {Promise<Download>} The started download.
     */
    async pressEnterAndWaitForDownload(): Promise<Download> {
        const download = this.page.waitForEvent('download');
        await this.page.keyboard.press('Enter');
        return download;
    }

    // ==================== Verifications ====================

    /**
     * Verifies the file has been prepared in the background and is ready to save.
     *
     * @returns {Promise<void>}
     */
    async readyToSaveAndVerify(): Promise<void> {
        await expect(this.button).toHaveAttribute(
            SaveOnly.READY_ATTRIBUTE,
            SaveOnly.READY
        );
    }

    /**
     * Verifies the file has not been prepared in the background (yet, or at all).
     *
     * @returns {Promise<void>}
     */
    async notReadyToSaveAndVerify(): Promise<void> {
        await expect(this.button).not.toHaveAttribute(
            SaveOnly.READY_ATTRIBUTE,
            SaveOnly.READY
        );
    }

    /**
     * Verifies the button is in its resting state: idle label, download arrow.
     *
     * @returns {Promise<void>}
     */
    async idleStateAndVerify(): Promise<void> {
        await expect(this.button).toHaveAttribute(
            CvButtonText.STATE_ATTRIBUTE,
            CvButtonText.STATE_IDLE
        );
        await expect(this.idleLink).toBeVisible();
        await expect(this.idleIcon).toBeVisible();
        await expect(this.doneIcon).toBeHidden();
    }

    /**
     * Verifies the button shows its confirmation: "Download started" and a check mark.
     *
     * @returns {Promise<void>}
     */
    async confirmationShownAndVerify(): Promise<void> {
        await expect(this.button).toHaveAttribute(
            CvButtonText.STATE_ATTRIBUTE,
            CvButtonText.STATE_DONE
        );
        await expect(this.doneLink).toBeVisible();
        await expect(this.doneIcon).toBeVisible();
        await expect(this.idleIcon).toBeHidden();
        await expect(this.idleLink).toHaveCount(0);
    }

    /**
     * Clicks the button and verifies it keeps exactly the same size while the
     * neighbouring element stays where it was, so nothing around it jumps.
     *
     * @param {Locator} neighbour - An element next to the button.
     * @returns {Promise<void>}
     */
    async clickKeepsSizeAndNeighbourAndVerify(
        neighbour: Locator
    ): Promise<void> {
        const idleBox = await this.button.boundingBox();
        const neighbourBefore = await neighbour.boundingBox();
        await this.click();
        await expect(this.doneLink).toBeVisible();
        const doneBox = await this.button.boundingBox();
        const neighbourAfter = await neighbour.boundingBox();
        expect(idleBox).not.toBeNull();
        expect(doneBox).not.toBeNull();
        expect(neighbourBefore).not.toBeNull();
        expect(neighbourAfter).not.toBeNull();
        if (!idleBox || !doneBox || !neighbourBefore || !neighbourAfter) return;
        expect(Math.abs(doneBox.width - idleBox.width)).toBeLessThanOrEqual(
            CvTolerances.SIZE
        );
        expect(Math.abs(doneBox.height - idleBox.height)).toBeLessThanOrEqual(
            CvTolerances.SIZE
        );
        expect(neighbourAfter.x).toBeCloseTo(
            neighbourBefore.x,
            CvTolerances.POSITION_PRECISION
        );
        expect(neighbourAfter.y).toBeCloseTo(
            neighbourBefore.y,
            CvTolerances.POSITION_PRECISION
        );
    }
}
