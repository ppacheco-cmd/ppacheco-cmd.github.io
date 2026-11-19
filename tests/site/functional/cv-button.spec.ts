import type { Download } from '@playwright/test';
import { expect, test } from '../../../fixtures/pom/test-options';
import {
    trackWindowOpen,
    windowOpenCount,
} from '../../../helpers/site/browser';
import { ColorSchemes } from '../../../enums/site/help';
import { HomeText } from '../../../enums/site/site';
import { MotionPreferences } from '../../../enums/site/theme';
import {
    CvAnimations,
    CvButtonCounts,
    CvButtonText,
    CvColors,
    CvTimings,
    TabCounts,
} from '../../../enums/site/cv';
import { ContentLinks } from '../../../enums/site/theme';
import type { HomePage } from '../../../pages/site/home.page';
import type { ResumePage } from '../../../pages/site/resume.page';

/** The CV button exists on both pages; each page object exposes it as `cvButton` */
const PAGES = [
    { name: 'home page', pick: 'homePage' },
    { name: 'resume page', pick: 'resumePage' },
] as const;

type Pages = { homePage: HomePage; resumePage: ResumePage };

const PAGE_OF: Record<
    (typeof PAGES)[number]['pick'],
    (pages: Pages) => HomePage | ResumePage
> = {
    homePage: (pages) => pages.homePage,
    resumePage: (pages) => pages.resumePage,
};

for (const { name, pick } of PAGES) {
    test.describe(`CV button on the ${name}`, () => {
        test.use({ colorScheme: ColorSchemes.LIGHT });

        test(
            'should download the file and do nothing else: no new tab, no redirect',
            { tag: '@smoke' },
            async ({ homePage, resumePage, page, context }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                const urlBefore = page.url();

                await test.step('WHEN I click the button', async () => {
                    const download =
                        await subject.cvButton.clickAndWaitForDownload();
                    expect(download.suggestedFilename()).toBe(
                        CvButtonText.FILE
                    );
                });

                await test.step('THEN the click was handled and I am still on the same page, in the same tab', async () => {
                    await expect(subject.cvButton.doneLink).toBeVisible();
                    expect(context.pages()).toHaveLength(TabCounts.ONE);
                    expect(page.url()).toBe(urlBefore);
                    await expect(subject.heading).toHaveText(HomeText.NAME);
                });
            }
        );

        test(
            'should never call window.open',
            { tag: '@regression' },
            async ({ homePage, resumePage, page }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await trackWindowOpen(page);
                await subject.open();
                await subject.cvButton.click();
                await expect(subject.cvButton.doneLink).toBeVisible();
                expect(await windowOpenCount(page)).toBe(0);
            }
        );

        test(
            'should have no target on the link, so the visitor stays on this tab',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                const { button } = subject.cvButton;
                await expect(button).not.toHaveAttribute('target', /.*/);
                await expect(button).toHaveAttribute(
                    'download',
                    CvButtonText.FILE
                );
                await expect(button).toHaveAttribute('href', CvButtonText.HREF);
            }
        );

        test(
            'should show "Download started" with a check mark right after the click',
            { tag: '@smoke' },
            async ({ homePage, resumePage }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();

                await test.step('GIVEN the button is idle', async () => {
                    await subject.cvButton.idleStateAndVerify();
                });

                await test.step('WHEN I click it', async () => {
                    await subject.cvButton.click();
                });

                await test.step('THEN it confirms in the success colour', async () => {
                    await subject.cvButton.confirmationShownAndVerify();
                    await expect(subject.cvButton.button).toHaveCSS(
                        'background-color',
                        CvColors.SUCCESS_LIGHT
                    );
                });
            }
        );

        test(
            'should go back to the normal button after a few seconds',
            { tag: '@regression' },
            async ({ homePage, resumePage, page }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await page.clock.install();
                await subject.open();
                await subject.cvButton.click();
                await expect(subject.cvButton.doneLink).toBeVisible();

                await test.step('WHEN the confirmation time has passed', async () => {
                    await page.clock.runFor(CvTimings.CONFIRMATION);
                });

                await test.step('THEN the normal button is back, with an empty status', async () => {
                    await subject.cvButton.idleStateAndVerify();
                    await expect(subject.cvButton.status).toHaveText('');
                });

                await test.step('AND with the pointer away it has its normal colour', async () => {
                    await subject.heading.hover();
                    await expect(subject.cvButton.button).toHaveCSS(
                        'background-color',
                        CvColors.IDLE_ACCENT
                    );
                });
            }
        );

        test(
            'should keep exactly the same size so nothing around it jumps',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                await expect(subject.gitHubLink).toBeVisible();
                await subject.cvButton.clickKeepsSizeAndNeighbourAndVerify(
                    subject.gitHubLink
                );
            }
        );

        test(
            'should download again and restart the confirmation when clicked again',
            { tag: '@regression' },
            async ({ homePage, resumePage, page }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await page.clock.install();
                await subject.open();
                let first: Download | undefined;

                await test.step('WHEN I click, wait a little, and click again', async () => {
                    first = await subject.cvButton.clickAndWaitForDownload();
                    await expect(subject.cvButton.doneLink).toBeVisible();
                    await page.clock.runFor(CvTimings.BEFORE_SECOND_CLICK);
                });

                const second = await subject.cvButton.clickAndWaitForDownload();
                expect(first?.suggestedFilename()).toBe(CvButtonText.FILE);
                expect(second.suggestedFilename()).toBe(CvButtonText.FILE);

                await test.step("THEN the timer restarted: still confirming past the first one's end", async () => {
                    await page.clock.runFor(CvTimings.AFTER_SECOND_CLICK);
                    await subject.cvButton.confirmationShownAndVerify();
                });

                await test.step('AND the confirmation ends when the restarted timer does', async () => {
                    await page.clock.runFor(CvTimings.REMAINING);
                    await subject.cvButton.idleStateAndVerify();
                });
            }
        );

        test(
            'should work from the keyboard (Enter) and keep the focus on the button',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                await subject.cvButton.focus();
                const download =
                    await subject.cvButton.pressEnterAndWaitForDownload();
                expect(download.suggestedFilename()).toBe(CvButtonText.FILE);
                await expect(subject.cvButton.doneLink).toBeFocused();
            }
        );

        test(
            'should tell screen readers the download started (polite live region)',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                const { status } = subject.cvButton;
                await expect(status).toHaveAttribute(
                    'aria-live',
                    CvButtonText.LIVE_REGION
                );
                await expect(status).toHaveText('');
                await subject.cvButton.click();
                await expect(status).toHaveText(CvButtonText.STATUS_MESSAGE);
            }
        );

        test(
            'should always have an accessible name that matches what is visible',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                await expect(subject.cvButton.idleLink).toBeVisible();
                await subject.cvButton.click();
                await expect(subject.cvButton.button).toHaveAccessibleName(
                    CvButtonText.DONE
                );
            }
        );

        test.describe('with JavaScript off', () => {
            test.use({ javaScriptEnabled: false });

            test(
                'should still download the file',
                { tag: '@regression' },
                async ({ homePage, resumePage, context }) => {
                    const subject = PAGE_OF[pick]({ homePage, resumePage });
                    await subject.open();
                    const download =
                        await subject.cvButton.clickAndWaitForDownload();
                    expect(download.suggestedFilename()).toBe(
                        CvButtonText.FILE
                    );
                    expect(context.pages()).toHaveLength(TabCounts.ONE);
                }
            );
        });
    });
}

test.describe('CV button: themes and motion', () => {
    test.describe('on a dark system', () => {
        test.use({ colorScheme: ColorSchemes.DARK });

        test(
            'should use the light-green success colour with dark text',
            { tag: '@regression' },
            async ({ homePage }) => {
                await homePage.open();
                await homePage.cvButton.click();
                await homePage.cvButton.confirmationShownAndVerify();
                await expect(homePage.cvButton.button).toHaveCSS(
                    'background-color',
                    CvColors.SUCCESS_DARK
                );
                await expect(homePage.cvButton.button).toHaveCSS(
                    'color',
                    CvColors.SUCCESS_DARK_INK
                );
            }
        );
    });

    test.describe('on a light system', () => {
        test.use({ colorScheme: ColorSchemes.LIGHT });

        test(
            'should keep the success colour when hovered in the confirmed state',
            { tag: '@regression' },
            async ({ homePage }) => {
                await homePage.open();
                await homePage.cvButton.click();
                await homePage.cvButton.hover();
                await expect(homePage.cvButton.button).toHaveCSS(
                    'background-color',
                    CvColors.SUCCESS_LIGHT
                );
            }
        );
    });

    for (const { preference, animation } of [
        {
            preference: MotionPreferences.NO_PREFERENCE,
            animation: CvAnimations.POP,
        },
        { preference: MotionPreferences.REDUCE, animation: CvAnimations.NONE },
    ]) {
        test.describe(`with motion preference "${preference}"`, () => {
            test.use({
                reducedMotion: preference,
                colorScheme: ColorSchemes.LIGHT,
            });

            test(
                `should animate the check mark as "${animation}" and always show the confirmation`,
                { tag: '@regression' },
                async ({ homePage }) => {
                    await homePage.open();
                    await homePage.cvButton.click();
                    await expect(homePage.cvButton.doneIcon).toHaveCSS(
                        'animation-name',
                        animation
                    );
                    await expect(homePage.cvButton.doneLink).toBeVisible();
                }
            );
        });
    }
});

test.describe('CV button: scope', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    test(
        'should be the only button with the confirmation; GitHub is untouched',
        { tag: '@regression' },
        async ({ homePage }) => {
            await homePage.open();
            await expect(homePage.cvButton.button).toHaveCount(
                CvButtonCounts.PER_PAGE
            );
            await expect(homePage.gitHubLink).not.toHaveAttribute(
                CvButtonText.STATE_ATTRIBUTE,
                /.*/
            );
            await homePage.gitHubLink.hover();
            await expect(homePage.gitHubLink).toHaveAttribute(
                'target',
                ContentLinks.NEW_TAB
            );
        }
    );
});
