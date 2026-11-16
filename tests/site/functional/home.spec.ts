import { expect, test } from '../../../fixtures/pom/test-options';
import { HomeCounts, HomeText, PageTitles } from '../../../enums/site/site';

test.describe('Home page', () => {
    test.beforeEach(async ({ homePage }) => {
        await homePage.open();
    });

    test(
        'should show the name, the role and the CV download link',
        { tag: '@smoke' },
        async ({ homePage, page }) => {
            await test.step('THEN the page is titled and shows who I am', async () => {
                await expect(page).toHaveTitle(PageTitles.HOME);
                await expect(homePage.heading).toHaveText(HomeText.NAME);
                await expect(homePage.role).toBeVisible();
            });

            await test.step('AND the CV can be downloaded', async () => {
                await expect(homePage.cvLink).toBeVisible();
                await expect(homePage.cvLink).toHaveAttribute(
                    'download',
                    /\.pdf$/
                );
            });
        }
    );

    test(
        'should offer ready-made questions and show the answer to the selected one',
        { tag: '@smoke' },
        async ({ homePage }) => {
            await test.step('GIVEN the questions are offered and none is answered yet', async () => {
                await expect(homePage.questionButtons).toHaveCount(
                    HomeCounts.QUESTIONS
                );
                await expect(homePage.answerPrompt).toBeVisible();
            });

            await test.step('WHEN I select a question', async () => {
                await homePage.askQuestion(HomeText.QUESTION_WHO);
            });

            await test.step('THEN its answer replaces the prompt', async () => {
                await expect(homePage.answerHeading).toHaveText(
                    HomeText.QUESTION_WHO
                );
                await expect(homePage.answerPrompt).toBeHidden();
            });
        }
    );
});
