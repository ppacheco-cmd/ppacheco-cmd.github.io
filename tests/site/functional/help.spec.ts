import { expect, test } from '../../../fixtures/pom/test-options';
import { horizontalOverflow } from '../../../helpers/site/layout';
import {
    ColorSchemes,
    HelpText,
    LayoutLimits,
    PhoneViewport,
    ThemeColors,
} from '../../../enums/site/help';
import { HomeText } from '../../../enums/site/site';
import type { HomePage } from '../../../pages/site/home.page';
import type { ResumePage } from '../../../pages/site/resume.page';

/** The "?" help exists on both pages; each page object exposes it as `help`. */
const PAGES = [
    { name: 'home page', pick: 'homePage' },
    { name: 'resume page', pick: 'resumePage' },
] as const;

type Pages = { homePage: HomePage; resumePage: ResumePage };

/** Picks the page object for the page under test, without branching inside a test */
const PAGE_OF: Record<
    (typeof PAGES)[number]['pick'],
    (p: Pages) => HomePage | ResumePage
> = {
    homePage: (p) => p.homePage,
    resumePage: (p) => p.resumePage,
};

for (const { name, pick } of PAGES) {
    test.describe(`"?" help on the ${name}`, () => {
        test.use({ colorScheme: ColorSchemes.LIGHT });

        test.beforeEach(async ({ homePage, resumePage }) => {
            await PAGE_OF[pick]({ homePage, resumePage }).open();
        });

        test(
            'should sit right next to "QA Engineer", on the same line',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const { help } = PAGE_OF[pick]({ homePage, resumePage });

                await test.step('THEN the button is next to the role and big enough to tap', async () => {
                    await expect(help.helpButton).toBeVisible();
                    await expect(help.helpButton).toHaveText(
                        HelpText.BUTTON_MARK
                    );
                    await help.nextToRoleAndVerify();
                });
            }
        );

        test(
            'should be closed at first, with the right accessibility state',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const { help } = PAGE_OF[pick]({ homePage, resumePage });

                await test.step('THEN the panel is hidden and the button says it is collapsed', async () => {
                    await expect(help.panel).toBeHidden();
                    await expect(help.closedHelpButton).toBeVisible();
                    await expect(help.helpButton).toHaveAttribute(
                        'aria-controls',
                        /.+/
                    );
                });
            }
        );

        test(
            'should open a short summary of what a QA engineer does when clicked',
            { tag: '@smoke' },
            async ({ homePage, resumePage }) => {
                const { help } = PAGE_OF[pick]({ homePage, resumePage });

                await test.step('WHEN I click the "?"', async () => {
                    await help.toggle();
                });

                await test.step('THEN the summary opens', async () => {
                    await expect(help.panel).toBeVisible();
                    await expect(help.openHelpButton).toBeVisible();
                    await help.summaryContentAndVerify();
                });
            }
        );

        test(
            'should NOT open when only hovered',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const { help } = PAGE_OF[pick]({ homePage, resumePage });

                await test.step('WHEN I hover over the "?"', async () => {
                    await help.hover();
                });

                await test.step('THEN nothing opens', async () => {
                    await expect(help.panel).toBeHidden();
                    await expect(help.closedHelpButton).toBeVisible();
                });
            }
        );

        test(
            'should still react to hover visually, without opening anything',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const { help } = PAGE_OF[pick]({ homePage, resumePage });

                await test.step('WHEN I hover over the "?"', async () => {
                    await help.hover();
                });

                await test.step('THEN it takes the accent colour and the panel stays closed', async () => {
                    await expect(help.helpButton).toHaveCSS(
                        'background-color',
                        ThemeColors.ACCENT_LIGHT
                    );
                    await expect(help.panel).toBeHidden();
                });
            }
        );

        test(
            'should stay open when the pointer leaves, and close on a second click',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const { help } = PAGE_OF[pick]({ homePage, resumePage });

                await test.step('GIVEN the panel is open', async () => {
                    await help.toggle();
                    await expect(help.panel).toBeVisible();
                });

                await test.step('WHEN the pointer leaves the button', async () => {
                    await help.moveAway();
                });

                await test.step('THEN it stays open', async () => {
                    await expect(help.panel).toBeVisible();
                    await expect(help.openHelpButton).toBeVisible();
                });

                await test.step('WHEN I click the "?" again', async () => {
                    await help.toggle();
                });

                await test.step('THEN it closes', async () => {
                    await expect(help.panel).toBeHidden();
                    await expect(help.closedHelpButton).toBeVisible();
                });
            }
        );

        test(
            'should close with Escape',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const { help } = PAGE_OF[pick]({ homePage, resumePage });

                await test.step('GIVEN the panel is open', async () => {
                    await help.toggle();
                    await expect(help.panel).toBeVisible();
                });

                await test.step('WHEN I press Escape', async () => {
                    await help.pressKey('Escape');
                });

                await test.step('THEN it closes', async () => {
                    await expect(help.panel).toBeHidden();
                });
            }
        );

        test(
            'should close when I click anywhere else',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const { help } = PAGE_OF[pick]({ homePage, resumePage });

                await test.step('GIVEN the panel is open', async () => {
                    await help.toggle();
                    await expect(help.panel).toBeVisible();
                });

                await test.step('WHEN I click elsewhere', async () => {
                    await help.clickElsewhere();
                });

                await test.step('THEN it closes', async () => {
                    await expect(help.panel).toBeHidden();
                });
            }
        );

        test(
            'should work from the keyboard and keep the focus on the button',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const { help } = PAGE_OF[pick]({ homePage, resumePage });

                await test.step('WHEN I focus the button and press Enter', async () => {
                    await help.focusButton();
                    await help.pressKey('Enter');
                });

                await test.step('THEN the panel opens', async () => {
                    await expect(help.panel).toBeVisible();
                    await expect(help.openHelpButton).toBeVisible();
                });

                await test.step('WHEN I press Escape', async () => {
                    await help.pressKey('Escape');
                });

                await test.step('THEN it closes and the focus stays on the button', async () => {
                    await expect(help.panel).toBeHidden();
                    await expect(help.helpButton).toBeFocused();
                });

                await test.step('WHEN I press Space', async () => {
                    await help.pressKey('Space');
                });

                await test.step('THEN it opens again', async () => {
                    await expect(help.panel).toBeVisible();
                });
            }
        );

        test(
            'should stay on screen and not cover the name above it',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const { help } = PAGE_OF[pick]({ homePage, resumePage });

                await test.step('WHEN I open the panel', async () => {
                    await help.toggle();
                    await expect(help.panel).toBeVisible();
                });

                await test.step('THEN it fits the viewport and opens below the heading', async () => {
                    await help.panelOnScreenAndVerify();
                });
            }
        );

        test(
            'should not move anything on the page when it opens',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const { help } = PAGE_OF[pick]({ homePage, resumePage });

                await test.step('THEN opening leaves the heading and role text where they were', async () => {
                    await help.openingMovesNothingAndVerify();
                    await expect(help.panel).toBeVisible();
                });
            }
        );

        test(
            'should not be shown in print, even when open',
            { tag: '@regression' },
            async ({ homePage, resumePage, page }) => {
                const { help } = PAGE_OF[pick]({ homePage, resumePage });

                await test.step('GIVEN the panel is open', async () => {
                    await help.toggle();
                    await expect(help.panel).toBeVisible();
                });

                await test.step('WHEN the page is printed', async () => {
                    await page.emulateMedia({ media: 'print' });
                });

                await test.step('THEN neither the button nor the panel is shown', async () => {
                    await expect(help.helpButton).toBeHidden();
                    await expect(help.panel).toBeHidden();
                });
            }
        );
    });
}

test.describe('"?" help: themes, phone, no JavaScript', () => {
    for (const { scheme, background, ink } of [
        {
            scheme: ColorSchemes.LIGHT,
            background: ThemeColors.PAGE_BG_LIGHT,
            ink: ThemeColors.INK_LIGHT,
        },
        {
            scheme: ColorSchemes.DARK,
            background: ThemeColors.PAGE_BG_DARK,
            ink: ThemeColors.INK_DARK,
        },
    ]) {
        test.describe(`in ${scheme} mode`, () => {
            test.use({ colorScheme: scheme });

            test(
                `should use the ${scheme} page colours (solid box, readable text)`,
                { tag: '@regression' },
                async ({ homePage }) => {
                    await homePage.open();

                    await test.step('WHEN I open the panel', async () => {
                        await homePage.help.toggle();
                    });

                    await test.step('THEN its colours come from the theme', async () => {
                        await expect(homePage.help.panel).toHaveCSS(
                            'background-color',
                            background
                        );
                        await expect(homePage.help.panel).toHaveCSS(
                            'color',
                            ink
                        );
                    });
                }
            );
        });
    }

    test.describe('open state', () => {
        test.use({ colorScheme: ColorSchemes.LIGHT });

        test(
            'should highlight the button with the accent colour while open',
            { tag: '@regression' },
            async ({ homePage }) => {
                await homePage.open();

                await test.step('GIVEN the panel is open and the pointer is elsewhere', async () => {
                    await homePage.help.toggle();
                    await homePage.help.moveAway();
                });

                await test.step('THEN the button keeps the accent colour', async () => {
                    await expect(homePage.help.helpButton).toHaveCSS(
                        'background-color',
                        ThemeColors.ACCENT_LIGHT
                    );
                });
            }
        );
    });

    test.describe('on a phone', () => {
        test.use({
            viewport: {
                width: PhoneViewport.WIDTH,
                height: PhoneViewport.HEIGHT,
            },
            hasTouch: true,
            colorScheme: ColorSchemes.LIGHT,
        });

        test(
            'should open on a tap, fit the screen, and close on a tap elsewhere',
            { tag: '@regression' },
            async ({ homePage, page }) => {
                await homePage.open();

                await test.step('WHEN I tap the "?"', async () => {
                    await homePage.help.tap();
                });

                await test.step('THEN the panel opens and fits the screen', async () => {
                    await expect(homePage.help.panel).toBeVisible();
                    await homePage.help.panelOnScreenAndVerify();
                    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(
                        LayoutLimits.MAX_HORIZONTAL_OVERFLOW
                    );
                });

                await test.step('WHEN I tap elsewhere', async () => {
                    await homePage.help.tapElsewhere();
                });

                await test.step('THEN it closes', async () => {
                    await expect(homePage.help.panel).toBeHidden();
                });
            }
        );
    });

    test.describe('without JavaScript', () => {
        test.use({ javaScriptEnabled: false, colorScheme: ColorSchemes.LIGHT });

        test(
            'should hide the "?" (it could not do anything) and still show the role',
            { tag: '@regression' },
            async ({ homePage }) => {
                await homePage.open();

                await test.step('THEN there is no "?" button but the role is shown', async () => {
                    await expect(homePage.help.helpButton).toBeHidden();
                    await expect(homePage.help.roleLabel).toBeVisible();
                    await expect(homePage.help.roleLabel).toHaveText(
                        HomeText.ROLE
                    );
                });
            }
        );
    });
});

test.describe('"?" help wording', () => {
    test(
        'should be named after the question it answers',
        { tag: '@smoke' },
        async ({ homePage }) => {
            await homePage.open();
            await expect(homePage.help.helpButton).toHaveAccessibleName(
                HelpText.BUTTON
            );
        }
    );
});
