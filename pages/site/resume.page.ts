import { Locator, Page } from '@playwright/test';
import { TopBarComponent } from '../components/topbar.component';
import { ResumeSections, SiteRoutes } from '../../enums/site/site';

/**
 * Page Object for the web resume: section headings, skills and dates.
 */
export class ResumePage {
    readonly topBar: TopBarComponent;

    constructor(private readonly page: Page) {
        this.topBar = new TopBarComponent(page);
    }

    // ==================== Locators ====================

    get sectionHeadings(): Locator {
        return this.page.getByRole('main').getByRole('heading', { level: 2 });
    }

    get skillLines(): Locator {
        return this.page
            .getByRole('region', { name: ResumeSections.SKILLS })
            .getByRole('paragraph');
    }

    get dates(): Locator {
        return this.page.getByRole('time');
    }

    sectionHeading(name: string): Locator {
        return this.page
            .getByRole('main')
            .getByRole('heading', { level: 2, name, exact: true });
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
}
