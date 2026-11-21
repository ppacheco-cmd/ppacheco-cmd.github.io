import { Locator, Page, expect } from '@playwright/test';
import { TopBarComponent } from '../components/topbar.component';
import { HelpComponent } from '../components/help.component';
import { CvButtonComponent } from '../components/cv-button.component';
import { CvButtonText } from '../../enums/site/cv';
import { HomeText, SiteRoutes } from '../../enums/site/site';
import { TestIds } from '../../enums/site/help';
import { PageTestIds } from '../../enums/site/resume';
import { I18nTestIds } from '../../enums/site/i18n';
import { ProjectTestIds } from '../../enums/site/projects';
import { AnswerLimits, AskUi } from '../../enums/site/ask';
import {
    ContactIcons,
    ContentLinks,
    IconTestIds,
    PhoneLayout,
    TopBarLayout,
} from '../../enums/site/theme';

/**
 * Page Object for the home page: name, role, CV download and the
 * "Ask about my background" question chips.
 */
export class HomePage {
    readonly topBar: TopBarComponent;
    readonly help: HelpComponent;
    readonly cvButton: CvButtonComponent;

    constructor(private readonly page: Page) {
        this.topBar = new TopBarComponent(page);
        this.help = new HelpComponent(page);
        this.cvButton = new CvButtonComponent(page, CvButtonText.HOME_IDLE);
    }

    // ==================== Locators ====================

    get documentBody(): Locator {
        return this.page.getByTestId(PageTestIds.PAGE);
    }

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

    get gitHubLink(): Locator {
        return this.page.getByRole('link', {
            name: ContentLinks.GITHUB_NAME,
            exact: true,
        });
    }

    get linkedInIcon(): Locator {
        return this.page.getByTestId(IconTestIds.LINKEDIN);
    }

    get emailIcon(): Locator {
        return this.page.getByTestId(IconTestIds.EMAIL);
    }

    get linkedInLinkExact(): Locator {
        return this.page.getByRole('link', {
            name: ContentLinks.LINKEDIN_NAME,
            exact: true,
        });
    }

    get emailLinkExact(): Locator {
        return this.page.getByRole('link', {
            name: ContentLinks.EMAIL_NAME,
            exact: true,
        });
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

    get projectsSection(): Locator {
        return this.page.getByTestId(ProjectTestIds.SECTION);
    }

    get projectsHeading(): Locator {
        return this.projectsSection.getByRole('heading', { level: 2 });
    }

    get projectCard(): Locator {
        return this.page.getByTestId(ProjectTestIds.CARD);
    }

    get projectName(): Locator {
        return this.projectCard.getByRole('heading', { level: 3 });
    }

    get projectTags(): Locator {
        return this.projectCard.getByRole('listitem');
    }

    get projectTagList(): Locator {
        return this.projectCard.getByRole('list');
    }

    get projectLink(): Locator {
        return this.projectCard.getByRole('link');
    }

    get questionChips(): Locator {
        return this.page.getByTestId(I18nTestIds.CHIPS).getByRole('button');
    }

    get pressedChips(): Locator {
        return this.page
            .getByTestId(I18nTestIds.CHIPS)
            .getByRole('button', { pressed: true });
    }

    get answerHint(): Locator {
        return this.page.getByTestId(I18nTestIds.HINT);
    }

    get answerLinks(): Locator {
        return this.answerPanel.getByRole('link');
    }

    get emailContactLink(): Locator {
        return this.page.getByRole('link').filter({ has: this.emailIcon });
    }

    askHeadingNamed(name: string): Locator {
        return this.page.getByRole('heading', { name });
    }

    chipNamed(text: string): Locator {
        return this.questionChips.getByText(text, { exact: true });
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
     * Opens the home page with a language chosen in the address (`?lang=`).
     *
     * @param {string} code - The language code, as written in the address.
     * @returns {Promise<void>}
     */
    async openWithLanguage(code: string): Promise<void> {
        await this.page.goto(`${SiteRoutes.HOME}?lang=${code}`);
    }

    /**
     * Clicks a question chip by its visible text.
     *
     * @param {string} text - The chip's text in the current language.
     * @returns {Promise<void>}
     */
    async clickChip(text: string): Promise<void> {
        await this.chipNamed(text).click();
    }

    /**
     * Opens the home page and returns as soon as the document starts arriving,
     * to check what the page's first script does before anything is painted.
     *
     * @returns {Promise<void>}
     */
    async openWithoutWaiting(): Promise<void> {
        await this.page.goto(SiteRoutes.HOME, { waitUntil: 'commit' });
    }

    /**
     * Reloads the home page.
     *
     * @returns {Promise<void>}
     */
    async reload(): Promise<void> {
        await this.page.reload();
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

    /**
     * Reads all the text on the page as the visitor sees it.
     *
     * @returns {Promise<string>} The visible text of the whole page.
     */
    async bodyText(): Promise<string> {
        return this.documentBody.innerText();
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
     * Verifies that on a wide screen the content stays in its own centred
     * column and is not dragged to the screen edge under the full-width bar.
     *
     * @returns {Promise<void>}
     */
    async contentSitsInCentredColumnAndVerify(): Promise<void> {
        const name = await this.heading.boundingBox();
        const brand = await this.topBar.brandLink.boundingBox();
        expect(name).not.toBeNull();
        expect(brand).not.toBeNull();
        if (!name || !brand) return;
        expect(name.x).toBeGreaterThan(
            brand.x + TopBarLayout.COLUMN_MIN_OFFSET
        );
        expect(name.x).toBeLessThan(TopBarLayout.WIDE_WIDTH / 2);
    }

    /**
     * Verifies that on a phone the CV and GitHub buttons stack at the full
     * width of the content.
     *
     * @returns {Promise<void>}
     */
    async buttonsStackFullWidthAndVerify(): Promise<void> {
        const cv = await this.cvLink.boundingBox();
        const github = await this.gitHubLink.boundingBox();
        const viewport = this.page.viewportSize();
        expect(cv).not.toBeNull();
        expect(github).not.toBeNull();
        expect(viewport).not.toBeNull();
        if (!cv || !github || !viewport) return;
        expect(github.y).toBeGreaterThan(
            cv.y + cv.height - PhoneLayout.ROUNDING_SLACK
        );
        expect(Math.abs(cv.width - github.width)).toBeLessThanOrEqual(
            PhoneLayout.ROUNDING_SLACK
        );
        expect(cv.width).toBeGreaterThan(
            viewport.width -
                PhoneLayout.CONTENT_GUTTER * 2 -
                PhoneLayout.BORDER_SLACK
        );
    }

    /**
     * Verifies a contact link has a decorative icon, left of its label,
     * vertically centred with it, at the standard size.
     *
     * @param {Locator} link - The contact link.
     * @param {Locator} icon - The icon inside that link.
     * @returns {Promise<void>}
     */
    async contactIconSitsBeforeLabelAndVerify(
        link: Locator,
        icon: Locator
    ): Promise<void> {
        await expect(link).toBeVisible();
        await expect(icon).toHaveCount(1);
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
        const iconBox = await icon.boundingBox();
        const linkBox = await link.boundingBox();
        expect(iconBox).not.toBeNull();
        expect(linkBox).not.toBeNull();
        if (!iconBox || !linkBox) return;
        expect(Math.round(iconBox.width)).toBe(ContactIcons.SIZE);
        expect(Math.round(iconBox.height)).toBe(ContactIcons.SIZE);
        expect(iconBox.x).toBeLessThan(linkBox.x + linkBox.width / 2);
        expect(
            Math.abs(
                iconBox.y +
                    iconBox.height / 2 -
                    (linkBox.y + linkBox.height / 2)
            )
        ).toBeLessThan(ContactIcons.MAX_CENTRE_OFFSET);
    }

    /**
     * Verifies the contact links are big enough to tap.
     *
     * @returns {Promise<void>}
     */
    async contactLinksAreTappableAndVerify(): Promise<void> {
        for (const link of [this.linkedInLinkExact, this.emailLinkExact]) {
            const box = await link.boundingBox();
            expect(box).not.toBeNull();
            if (!box) continue;
            expect(box.height).toBeGreaterThanOrEqual(
                ContactIcons.MIN_TAP_HEIGHT
            );
        }
    }

    /**
     * Verifies the Projects section comes after the questions section.
     *
     * @returns {Promise<void>}
     */
    async projectsComeAfterQuestionsAndVerify(): Promise<void> {
        const questions = await this.askHeading.boundingBox();
        const projects = await this.projectsHeading.boundingBox();
        expect(questions).not.toBeNull();
        expect(projects).not.toBeNull();
        if (!questions || !projects) return;
        expect(projects.y).toBeGreaterThan(questions.y);
    }

    /**
     * Verifies the project card stays inside the viewport width.
     *
     * @returns {Promise<void>}
     */
    async projectCardFitsViewportAndVerify(): Promise<void> {
        const box = await this.projectCard.boundingBox();
        const viewport = this.page.viewportSize();
        expect(box).not.toBeNull();
        expect(viewport).not.toBeNull();
        if (!box || !viewport) return;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
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
