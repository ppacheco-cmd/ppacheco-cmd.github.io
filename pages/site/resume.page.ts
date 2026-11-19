import { Locator, Page, expect } from '@playwright/test';
import { TopBarComponent } from '../components/topbar.component';
import { HelpComponent } from '../components/help.component';
import { CvButtonComponent } from '../components/cv-button.component';
import { CvButtonText } from '../../enums/site/cv';
import { ResumeSections, SiteRoutes } from '../../enums/site/site';
import {
    PageTestIds,
    PrintSettings,
    ResumeLinks,
} from '../../enums/site/resume';

/**
 * Page Object for the web resume: sections, jobs, links, dates and print view.
 */
export class ResumePage {
    readonly topBar: TopBarComponent;
    readonly help: HelpComponent;
    readonly cvButton: CvButtonComponent;

    constructor(private readonly page: Page) {
        this.topBar = new TopBarComponent(page);
        this.help = new HelpComponent(page);
        this.cvButton = new CvButtonComponent(page, CvButtonText.RESUME_IDLE);
    }

    // ==================== Locators ====================

    get nameHeading(): Locator {
        return this.page.getByRole('heading', { level: 1 });
    }

    get heading(): Locator {
        return this.nameHeading;
    }

    get mainContent(): Locator {
        return this.page.getByRole('main');
    }

    get documentBody(): Locator {
        return this.page.getByTestId(PageTestIds.PAGE);
    }

    get sectionHeadings(): Locator {
        return this.page.getByRole('main').getByRole('heading', { level: 2 });
    }

    get skillLines(): Locator {
        return this.page
            .getByRole('region', { name: ResumeSections.SKILLS })
            .getByRole('paragraph');
    }

    get experienceRegion(): Locator {
        return this.page.getByRole('region', {
            name: ResumeSections.EXPERIENCE,
        });
    }

    get languagesRegion(): Locator {
        return this.page.getByRole('region', {
            name: ResumeSections.LANGUAGES,
        });
    }

    get jobs(): Locator {
        return this.experienceRegion.getByRole('article');
    }

    get dates(): Locator {
        return this.page.getByRole('time');
    }

    get dateLines(): Locator {
        return this.mainContent
            .getByRole('paragraph')
            .filter({ has: this.page.getByRole('time') });
    }

    get mainLinks(): Locator {
        return this.mainContent.getByRole('link');
    }

    get emailLink(): Locator {
        return this.page.getByRole('link', {
            name: ResumeLinks.EMAIL_ADDRESS,
        });
    }

    get linkedInLink(): Locator {
        return this.page.getByRole('link', { name: ResumeLinks.LINKEDIN_NAME });
    }

    get gitHubLink(): Locator {
        return this.page.getByRole('link', { name: ResumeLinks.GITHUB_NAME });
    }

    get pdfLink(): Locator {
        return this.page.getByRole('link', { name: ResumeLinks.PDF_NAME });
    }

    sectionHeading(name: string): Locator {
        return this.page
            .getByRole('main')
            .getByRole('heading', { level: 2, name, exact: true });
    }

    job(name: string): Locator {
        return this.jobs.filter({ hasText: name });
    }

    // ==================== Actions ====================

    /**
     * Opens the resume page.
     *
     * @returns {Promise<void>}
     */
    async open(): Promise<void> {
        await this.page.goto(SiteRoutes.RESUME);
    }

    /**
     * Switches the page to its print style, as when printing.
     *
     * @returns {Promise<void>}
     */
    async emulatePrint(): Promise<void> {
        await this.page.emulateMedia({ media: 'print' });
    }

    /**
     * Prints the page to an A4 PDF with the CV margins.
     *
     * @returns {Promise<Buffer>} The PDF file contents.
     */
    async printToPdf(): Promise<Buffer> {
        return this.page.pdf({
            format: PrintSettings.FORMAT,
            margin: {
                top: PrintSettings.MARGIN,
                bottom: PrintSettings.MARGIN,
                left: PrintSettings.MARGIN,
                right: PrintSettings.MARGIN,
            },
        });
    }

    /**
     * Reads the text a visitor sees (top bar and main content).
     *
     * @returns {Promise<string>} The visible text.
     */
    async visibleText(): Promise<string> {
        const bar = await this.topBar.banner.innerText();
        const main = await this.mainContent.innerText();
        return `${bar}\n${main}`;
    }

    /**
     * Reads the page source as the browser holds it.
     *
     * @returns {Promise<string>} The HTML of the page.
     */
    async sourceHtml(): Promise<string> {
        return this.page.content();
    }

    /**
     * Reads the machine-readable value of every date on the page.
     *
     * @returns {Promise<string[]>} The `datetime` values, e.g. `2026-07`.
     */
    async isoMonths(): Promise<string[]> {
        const values: string[] = [];
        for (const date of await this.dates.all()) {
            values.push((await date.getAttribute('datetime')) ?? '');
        }
        return values;
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
     * Verifies every external link in the main content opens in a new tab and
     * is protected with `rel="noopener"`.
     *
     * @returns {Promise<number>} How many external links were checked.
     */
    async externalLinksOpenSafelyAndVerify(): Promise<number> {
        let checked = 0;
        for (const link of await this.mainLinks.all()) {
            const href = (await link.getAttribute('href')) ?? '';
            if (!href.startsWith('http')) continue;
            await expect(link).toHaveAttribute('target', ResumeLinks.NEW_TAB);
            await expect(link).toHaveAttribute(
                'rel',
                new RegExp(ResumeLinks.SAFE_REL)
            );
            checked += 1;
        }
        return checked;
    }

    /**
     * Verifies every job date line stays inside the viewport width.
     *
     * @returns {Promise<void>}
     */
    async dateLinesStayOnScreenAndVerify(): Promise<void> {
        const viewport = this.page.viewportSize();
        expect(viewport).not.toBeNull();
        if (!viewport) return;
        for (const line of await this.dateLines.all()) {
            const box = await line.boundingBox();
            expect(box).not.toBeNull();
            if (!box) continue;
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        }
    }
}
