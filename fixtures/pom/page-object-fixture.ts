import { test as base } from '@playwright/test';
import { HomePage } from '../../pages/site/home.page';
import { ResumePage } from '../../pages/site/resume.page';

/**
 * Framework fixtures for page objects.
 * Register each page object here as it is created (pages/site/*.page.ts).
 */
export type FrameworkFixtures = {
    /** Home page: name, role, CV download, question chips */
    homePage: HomePage;
    /** Web resume page */
    resumePage: ResumePage;
};

/**
 * Extended test with page object fixtures.
 * Import this through `fixtures/pom/test-options.ts` in spec files.
 */
export const test = base.extend<FrameworkFixtures>({
    homePage: async ({ page }, use) => {
        await use(new HomePage(page));
    },

    resumePage: async ({ page }, use) => {
        await use(new ResumePage(page));
    },
});
