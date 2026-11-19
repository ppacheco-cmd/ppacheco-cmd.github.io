import type { HomePage } from '../../pages/site/home.page';
import type { ResumePage } from '../../pages/site/resume.page';

/** Pages that share a fragment (top bar, help, CV button), for specs that run on both */
export const PAGES = [
    { name: 'home page', pick: 'homePage' },
    { name: 'resume page', pick: 'resumePage' },
] as const;

/** The page-object fixtures a spec receives */
export type Pages = { homePage: HomePage; resumePage: ResumePage };

/**
 * Picks the page object for the page under test, without branching inside a test.
 */
export const PAGE_OF: Record<
    (typeof PAGES)[number]['pick'],
    (pages: Pages) => HomePage | ResumePage
> = {
    homePage: (pages) => pages.homePage,
    resumePage: (pages) => pages.resumePage,
};
