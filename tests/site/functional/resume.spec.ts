import { expect, test } from '../../../fixtures/pom/test-options';
import {
    PageTitles,
    ResumeSections,
    ResumeSkills,
} from '../../../enums/site/site';

/** Three-letter month and year, e.g. "Jul 2026" */
const SHORT_DATE = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/;

test.describe('Resume page', () => {
    test.beforeEach(async ({ resumePage }) => {
        await resumePage.open();
    });

    test(
        'should list the sections in the same order as the CV',
        { tag: '@smoke' },
        async ({ resumePage, page }) => {
            await test.step('THEN the page is titled as the resume', async () => {
                await expect(page).toHaveTitle(PageTitles.RESUME);
            });

            await test.step('AND the sections follow the CV order', async () => {
                await expect(resumePage.sectionHeadings).toHaveText(
                    Object.values(ResumeSections)
                );
            });
        }
    );

    test(
        'should show the skills lines exactly as on the CV',
        { tag: '@regression' },
        async ({ resumePage }) => {
            await test.step('THEN the testing, tools and soft skills lines match the CV', async () => {
                await expect(resumePage.skillLines).toHaveText(
                    Object.values(ResumeSkills)
                );
            });
        }
    );

    test(
        'should use one date format: three-letter months',
        { tag: '@regression' },
        async ({ resumePage }) => {
            await test.step('THEN every date is a three-letter month and a year', async () => {
                const dates = await resumePage.dates.allTextContents();
                for (const date of dates) {
                    expect(date).toMatch(SHORT_DATE);
                }
            });
        }
    );
});
