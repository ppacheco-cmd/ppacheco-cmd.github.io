import { Locator, Page, expect } from '@playwright/test';
import { TopBarComponent } from '../components/topbar.component';
import { HomeText, SiteRoutes } from '../../enums/site/site';

/**
 * Page Object for the home page: name, role, CV download and the
 * "Ask about my background" question chips.
 */
export class HomePage {
    readonly topBar: TopBarComponent;

    constructor(private readonly page: Page) {
        this.topBar = new TopBarComponent(page);
    }

    // ==================== Locators ====================

    get heading(): Locator {
        return this.page.getByRole('heading', { level: 1 });
    }

    get role(): Locator {
        return this.page.getByText(HomeText.ROLE, { exact: true });
    }

    get cvLink(): Locator {
        return this.page.getByRole('link', { name: HomeText.CV_LINK });
    }

    get questionButtons(): Locator {
        return this.page
            .getByRole('group', { name: HomeText.QUESTIONS_GROUP })
            .getByRole('button');
    }

    get answerPrompt(): Locator {
        return this.page.getByText(HomeText.ASK_PROMPT);
    }

    get answerHeading(): Locator {
        return this.page.getByRole('heading', { level: 3 });
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
     * Selects one of the ready-made questions.
     *
     * @param {string} question - The visible text of the question.
     * @returns {Promise<void>}
     */
    async askQuestion(question: string): Promise<void> {
        await this.questionButtons.getByText(question, { exact: true }).click();
    }

    /**
     * Selects a question and verifies it is pressed and its answer is shown.
     *
     * @param {string} question - The visible text of the question.
     * @returns {Promise<void>}
     */
    async askQuestionAndVerify(question: string): Promise<void> {
        await this.askQuestion(question);
        await expect(
            this.questionButtons.getByText(question, { exact: true })
        ).toHaveAttribute('aria-pressed', 'true');
        await expect(this.answerHeading).toHaveText(question);
        await expect(this.answerPrompt).toBeHidden();
    }
}
