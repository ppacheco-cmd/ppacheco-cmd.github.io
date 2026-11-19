import { expect, test } from '../../../fixtures/pom/test-options';
import { horizontalOverflow } from '../../../helpers/site/layout';
import {
    containsPhoneNumber,
    containsPlaceholder,
} from '../../../helpers/site/privacy';
import {
    AnswerPhrases,
    AskUi,
    Questions,
    ViewportRatio,
} from '../../../enums/site/ask';
import {
    ColorSchemes,
    LayoutLimits,
    PhoneViewport,
    ThemeColors,
} from '../../../enums/site/help';
import { HomeText, PageTitles, SiteRoutes } from '../../../enums/site/site';

const ALL_QUESTIONS = Object.values(Questions);

test.describe('Top bar navigation', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    test.beforeEach(async ({ homePage }) => {
        await homePage.open();
    });

    test(
        'should open the resume page from the Resume link',
        { tag: '@smoke' },
        async ({ homePage, page }) => {
            await test.step('WHEN I follow the Resume link', async () => {
                await homePage.topBar.clickResume();
            });

            await test.step('THEN the resume page opens', async () => {
                await expect(page).toHaveURL(
                    new RegExp(`${SiteRoutes.RESUME}$`)
                );
                await expect(page).toHaveTitle(PageTitles.RESUME);
                await expect(
                    page.getByRole('heading', { level: 1 })
                ).toHaveText(HomeText.NAME);
            });
        }
    );

    test(
        'should scroll to the questions section from the Ask link, below the sticky bar',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await test.step('GIVEN the questions heading is below the fold', async () => {
                await expect(homePage.askHeading).not.toBeInViewport();
            });

            await test.step('WHEN I follow the Ask link', async () => {
                await homePage.topBar.clickAsk();
            });

            await test.step('THEN the heading is fully in view and not covered by the bar', async () => {
                await expect(page).toHaveURL(
                    new RegExp(`${SiteRoutes.ASK_ANCHOR}$`)
                );
                await expect(homePage.askHeading).toBeInViewport({
                    ratio: ViewportRatio.FULL,
                });
                await homePage.barDoesNotCoverQuestionsHeadingAndVerify();
            });
        }
    );

    test(
        'should have exactly one Resume link, with LinkedIn and Email as the contact links',
        { tag: '@regression' },
        async ({ homePage }) => {
            await test.step('THEN there is no duplicate Resume link in the page body', async () => {
                await expect(homePage.resumeLinks).toHaveCount(1);
                await expect(homePage.topBar.resumeLink).toHaveCount(1);
            });

            await test.step('AND the contact links are LinkedIn and Email', async () => {
                await expect(homePage.linkedInLink).toBeVisible();
                await expect(homePage.emailLink).toBeVisible();
            });
        }
    );

    test(
        'should say the download is a PDF and point it at the CV file',
        { tag: '@regression' },
        async ({ homePage }) => {
            await expect(homePage.cvLink).toBeVisible();
            await expect(homePage.cvLink).toHaveAttribute(
                'href',
                AskUi.CV_HREF
            );
        }
    );
});

test.describe('Question chips', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    test.beforeEach(async ({ homePage }) => {
        await homePage.open();
    });

    test(
        'should show all questions in order, none selected, with a hint',
        { tag: '@smoke' },
        async ({ homePage }) => {
            await test.step('THEN every question is offered, in order', async () => {
                await expect(homePage.questionButtons).toHaveText(
                    ALL_QUESTIONS
                );
            });

            await test.step('AND none is pressed and the hint is shown', async () => {
                await expect(homePage.pressedQuestionButtons).toHaveCount(0);
                await expect(homePage.answerPanel).toContainText(
                    AskUi.PROMPT_HINT
                );
            });
        }
    );

    test(
        'should show the question and its answer, and mark the chip pressed',
        { tag: '@smoke' },
        async ({ homePage }) => {
            await test.step('WHEN I choose the automation question', async () => {
                await homePage.askQuestion(Questions.AUTOMATION);
            });

            await test.step('THEN the chip is pressed and the answer is shown', async () => {
                await expect(homePage.pressedQuestionButtons).toHaveText(
                    Questions.AUTOMATION
                );
                await expect(homePage.answerHeading).toHaveText(
                    Questions.AUTOMATION
                );
                await expect(homePage.answerPanel).toContainText(
                    AnswerPhrases.AUTOMATION_TOOLS
                );
                await expect(homePage.answerPanel).toContainText(
                    AnswerPhrases.AUTOMATION_SCHEDULE
                );
                await expect(homePage.answerPanel).not.toContainText(
                    AskUi.PROMPT_HINT
                );
            });
        }
    );

    test(
        'should keep only one chip pressed and replace the answer',
        { tag: '@regression' },
        async ({ homePage }) => {
            await test.step('WHEN I choose two questions in a row', async () => {
                await homePage.askQuestion(Questions.APIS);
                await homePage.askQuestion(Questions.MOBILE);
            });

            await test.step('THEN only the second is pressed and its answer replaced the first', async () => {
                await expect(homePage.pressedQuestionButtons).toHaveCount(1);
                await expect(homePage.pressedQuestionButtons).toHaveText(
                    Questions.MOBILE
                );
                await expect(homePage.answerPanel).toContainText(
                    AnswerPhrases.MOBILE_PLATFORM
                );
                await expect(homePage.answerPanel).not.toContainText(
                    AnswerPhrases.API_TOOL
                );
            });
        }
    );

    test(
        'should announce answer changes to screen readers',
        { tag: '@regression' },
        async ({ homePage }) => {
            await expect(homePage.answerPanel).toHaveAttribute(
                'aria-live',
                AskUi.LIVE_REGION
            );
        }
    );

    test(
        'should work from the keyboard: Tab to the next chip, Enter selects it',
        { tag: '@regression' },
        async ({ homePage }) => {
            await test.step('GIVEN the focus is on the first chip', async () => {
                await homePage.focusQuestion(Questions.WHO);
            });

            await test.step('WHEN I press Tab and Enter', async () => {
                await homePage.pressKey('Tab');
                await expect(
                    homePage.questionButton(Questions.QA_EXPERIENCE)
                ).toBeFocused();
                await homePage.pressKey('Enter');
            });

            await test.step('THEN the second question is selected and answered', async () => {
                await expect(homePage.pressedQuestionButtons).toHaveText(
                    Questions.QA_EXPERIENCE
                );
                await expect(homePage.answerHeading).toHaveText(
                    Questions.QA_EXPERIENCE
                );
            });
        }
    );

    test(
        'should use the accent colour for the selected chip in light and in dark mode',
        { tag: '@regression' },
        async ({ homePage }) => {
            await test.step('WHEN I select a chip', async () => {
                await homePage.askQuestion(Questions.WHO);
            });

            await test.step('THEN it uses the light-mode accent colour', async () => {
                await expect(homePage.pressedQuestionButtons).toHaveCSS(
                    'background-color',
                    ThemeColors.ACCENT_LIGHT
                );
            });

            await test.step('WHEN I switch to dark mode', async () => {
                await homePage.topBar.switchToDark();
            });

            await test.step('THEN it uses the dark-mode accent colour', async () => {
                await expect(homePage.pressedQuestionButtons).toHaveCSS(
                    'background-color',
                    ThemeColors.ACCENT_DARK
                );
            });
        }
    );
});

test.describe('Every answer', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    for (const question of ALL_QUESTIONS) {
        test.describe(question, () => {
            test.beforeEach(async ({ homePage }) => {
                await homePage.open();
                await homePage.askQuestionAndVerify(question);
            });

            test(
                'should be a real answer that links to the resume',
                { tag: '@regression' },
                async ({ homePage }) => {
                    await expect(homePage.answerHeading).toHaveText(question);
                    await homePage.answerIsSubstantialAndVerify();
                }
            );

            test(
                'should not contain a phone number',
                { tag: '@regression' },
                async ({ homePage }) => {
                    const text = await homePage.answerText();
                    expect(containsPhoneNumber(question + text)).toBe(false);
                }
            );

            test(
                'should not contain unfinished placeholder text',
                { tag: '@regression' },
                async ({ homePage }) => {
                    const text = await homePage.answerText();
                    expect(containsPlaceholder(text)).toBe(false);
                    expect(question.endsWith('?')).toBe(true);
                }
            );
        });
    }
});

test.describe('Honesty of the answers', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    test(
        'should be upfront that mobile testing is not professional experience',
        { tag: '@regression' },
        async ({ homePage }) => {
            await homePage.open();
            await homePage.askQuestion(Questions.MOBILE);
            await expect(homePage.answerPanel).toContainText(
                AnswerPhrases.MOBILE_HONESTY
            );
            await expect(homePage.answerPanel).toContainText(
                AnswerPhrases.MOBILE_TOOL
            );
        }
    );

    test(
        'should state the same language level and certification as the resume',
        { tag: '@regression' },
        async ({ homePage, resumePage }) => {
            await test.step('WHEN I read the education answer', async () => {
                await homePage.open();
                await homePage.askQuestion(Questions.EDUCATION);
            });

            await test.step('THEN it quotes the level and the certification', async () => {
                await expect(homePage.answerPanel).toContainText(
                    AnswerPhrases.LANGUAGE_LEVEL
                );
                await expect(homePage.answerPanel).toContainText(
                    AnswerPhrases.CERTIFICATION
                );
            });

            await test.step('AND the resume shows the same facts', async () => {
                await resumePage.open();
                await expect(resumePage.languagesRegion).toContainText(
                    AnswerPhrases.LANGUAGE_LEVEL
                );
                await expect(resumePage.languagesRegion).toContainText(
                    AnswerPhrases.CERTIFICATION
                );
            });
        }
    );

    test(
        'should name the same tools as the resume (Playwright, XRay)',
        { tag: '@regression' },
        async ({ homePage, resumePage }) => {
            await test.step('WHEN I read the automation and AI answers', async () => {
                await homePage.open();
                await homePage.askQuestion(Questions.AUTOMATION);
                await expect(homePage.answerPanel).toContainText(
                    AnswerPhrases.AUTOMATION_TOOLS
                );
                await homePage.askQuestion(Questions.AI);
                await expect(homePage.answerPanel).toContainText(
                    AnswerPhrases.AI_IMPORT_TOOL
                );
            });

            await test.step('THEN the resume mentions the same tools', async () => {
                await resumePage.open();
                await expect(resumePage.experienceRegion).toContainText(
                    AnswerPhrases.AI_IMPORT_TOOL
                );
                await expect(resumePage.experienceRegion).toContainText(
                    AnswerPhrases.AUTOMATION_TOOL
                );
            });
        }
    );
});

test.describe('Phone width', () => {
    test.use({
        viewport: { width: PhoneViewport.WIDTH, height: PhoneViewport.HEIGHT },
        colorScheme: ColorSchemes.LIGHT,
    });

    test(
        'should wrap the chips, avoid sideways scrolling and keep answers readable',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await homePage.openAtQuestions();

            await test.step('WHEN I choose the healthcare question', async () => {
                await homePage.askQuestion(Questions.HEALTHCARE);
            });

            await test.step('THEN the answer is shown and nothing overflows', async () => {
                await expect(homePage.answerPanel).toContainText(
                    AnswerPhrases.HEALTHCARE_EMPLOYER
                );
                expect(await horizontalOverflow(page)).toBeLessThanOrEqual(
                    LayoutLimits.MAX_HORIZONTAL_OVERFLOW
                );
                await homePage.answerFitsViewportAndVerify();
            });
        }
    );
});
