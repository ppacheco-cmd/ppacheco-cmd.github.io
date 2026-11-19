import { Locator, Page, expect } from '@playwright/test';
import { TopBarComponent } from '../components/topbar.component';
import { HelpComponent } from '../components/help.component';
import { HomeText, SiteRoutes } from '../../enums/site/site';
import { TestIds } from '../../enums/site/help';
import { AnswerLimits, AskUi } from '../../enums/site/ask';

/**
 * Page Object for the home page: name, role, CV download and the
 * "Ask about my background" question chips.
 */
export class HomePage {
    readonly topBar: TopBarComponent;
    readonly help: HelpComponent;

    constructor(private readonly page: Page) {
        this.topBar = new TopBarComponent(page);
        this.help = new HelpComponent(page);
    }

    // ==================== Locators ====================

    get heading(): Locator {
        return this.page.getByRole('heading', { level: 1 });
    }

    get role(): Locator {
        return this.page.getByTestId(TestIds.ROLE);
    }

    get cvLink(): Locator {
        return this.page.getByRole('link', { name: HomeText.CV_LINK });
    }

    get linkedInLink(): Locator {
        return this.page.getByRole('link', { name: AskUi.LINKEDIN_LINK });
    }

    get emailLink(): Locator {
        return this.page.getByRole('link', { name: AskUi.EMAIL_LINK });
    }

    get resumeLinks(): Locator {
        return this.page.getByRole('link', {
            name: AskUi.RESUME_LINK,
            exact: true,
        });
    }

    get askHeading(): Locator {
        return this.page.getByRole('heading', { name: AskUi.ASK_HEADING });
    }

    get questionButtons(): Locator {
        return this.page
            .getByRole('group', { name: HomeText.QUESTIONS_GROUP })
            .getByRole('button');
    }

    get pressedQuestionButtons(): Locator {
        return this.page
            .getByRole('group', { name: HomeText.QUESTIONS_GROUP })
            .getByRole('button', { pressed: true });
    }

    get answerPanel(): Locator {
        return this.page.getByTestId(TestIds.ANSWER);
    }

    get answerPrompt(): Locator {
        return this.page.getByText(HomeText.ASK_PROMPT);
    }

    get answerHeading(): Locator {
        return this.answerPanel.getByRole('heading', { level: 3 });
    }

    get answerMoreLink(): Locator {
        return this.answerPanel.getByRole('link', {
            name: AskUi.MORE_LINK,
            exact: true,
        });
    }

    questionButton(question: string): Locator {
        return this.questionButtons.getByText(question, { exact: true });
    }

    // ==================== Actions ====================

    /**
     * Opens the home page.
     *
     * @returns {Promise<void>}
     */
    async open(): Promise<void> {
        await this.page.goto(SiteRoutes.HOME);
    }

    /**
     * Opens the home page already scrolled to the questions section.
     *
     * @returns {Promise<void>}
     */
    async openAtQuestions(): Promise<void> {
        await this.page.goto(`${SiteRoutes.HOME}${SiteRoutes.ASK_ANCHOR}`);
    }

    /**
     * Selects one of the ready-made questions.
     *
     * @param {string} question - The visible text of the question.
     * @returns {Promise<void>}
     */
    async askQuestion(question: string): Promise<void> {
        await this.questionButton(question).click();
    }

    /**
     * Moves the keyboard focus onto a question button.
     *
     * @param {string} question - The visible text of the question.
     * @returns {Promise<void>}
     */
    async focusQuestion(question: string): Promise<void> {
        await this.questionButton(question).focus();
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

    /**
     * Reads the answer text as the visitor sees it.
     *
     * @returns {Promise<string>} The visible text of the answer panel.
     */
    async answerText(): Promise<string> {
        return (await this.answerPanel.innerText()).trim();
    }

    // ==================== Verifications ====================

    /**
     * Selects a question and verifies it is pressed and its answer is shown.
     *
     * @param {string} question - The visible text of the question.
     * @returns {Promise<void>}
     */
    async askQuestionAndVerify(question: string): Promise<void> {
        await this.askQuestion(question);
        await expect(this.questionButton(question)).toHaveAttribute(
            'aria-pressed',
            'true'
        );
        await expect(this.answerHeading).toHaveText(question);
        await expect(this.answerPrompt).toBeHidden();
    }

    /**
     * Verifies the shown answer is a real answer: long enough and linking to the resume.
     *
     * @returns {Promise<void>}
     */
    async answerIsSubstantialAndVerify(): Promise<void> {
        const text = await this.answerText();
        expect(text.length).toBeGreaterThan(AnswerLimits.MIN_LENGTH);
        await expect(this.answerMoreLink).toHaveAttribute(
            'href',
            AskUi.MORE_HREF
        );
    }

    /**
     * Verifies the sticky top bar does not cover the questions heading.
     *
     * @returns {Promise<void>}
     */
    async barDoesNotCoverQuestionsHeadingAndVerify(): Promise<void> {
        const bar = await this.topBar.banner.boundingBox();
        const heading = await this.askHeading.boundingBox();
        expect(bar).not.toBeNull();
        expect(heading).not.toBeNull();
        if (!bar || !heading) return;
        expect(heading.y).toBeGreaterThanOrEqual(bar.y + bar.height);
    }

    /**
     * Verifies the answer panel stays inside the viewport width.
     *
     * @returns {Promise<void>}
     */
    async answerFitsViewportAndVerify(): Promise<void> {
        const box = await this.answerPanel.boundingBox();
        const viewport = this.page.viewportSize();
        expect(box).not.toBeNull();
        expect(viewport).not.toBeNull();
        if (!box || !viewport) return;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    }
}
