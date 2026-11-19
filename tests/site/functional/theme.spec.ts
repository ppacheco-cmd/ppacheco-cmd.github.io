import { expect, test } from '../../../fixtures/pom/test-options';
import {
    blockLocalStorage,
    collectPageErrors,
    documentTheme,
    seedStoredTheme,
    storedTheme,
    themeColorMeta,
    waitForThemeAttribute,
} from '../../../helpers/site/browser';
import { ColorSchemes, ThemeColors } from '../../../enums/site/help';
import { ThemeLabels, ThemeValues } from '../../../enums/site/site';
import { ThemeMeta } from '../../../enums/site/theme';

test.describe('Theme: system default', () => {
    for (const { scheme, theme, background, label, meta } of [
        {
            scheme: ColorSchemes.LIGHT,
            theme: ThemeValues.LIGHT,
            background: ThemeColors.PAGE_BG_LIGHT,
            label: ThemeLabels.TO_DARK,
            meta: ThemeMeta.LIGHT,
        },
        {
            scheme: ColorSchemes.DARK,
            theme: ThemeValues.DARK,
            background: ThemeColors.PAGE_BG_DARK,
            label: ThemeLabels.TO_LIGHT,
            meta: ThemeMeta.DARK,
        },
    ]) {
        test.describe(`on a ${scheme} system`, () => {
            test.use({ colorScheme: scheme });

            test(
                `should follow the ${scheme} system setting`,
                { tag: '@smoke' },
                async ({ homePage, page }) => {
                    await homePage.open();
                    await expect.poll(() => documentTheme(page)).toBe(theme);
                    await expect(homePage.pageBody).toHaveCSS(
                        'background-color',
                        background
                    );
                    await expect(
                        homePage.topBar.themeToggle
                    ).toHaveAccessibleName(label);
                    await expect.poll(() => themeColorMeta(page)).toBe(meta);
                }
            );
        });
    }

    test.describe('on a light system that turns dark', () => {
        test.use({ colorScheme: ColorSchemes.LIGHT });

        test(
            'should follow live system changes until the visitor chooses',
            { tag: '@regression' },
            async ({ homePage, page }) => {
                await homePage.open();

                await test.step('GIVEN the page starts light', async () => {
                    await expect
                        .poll(() => documentTheme(page))
                        .toBe(ThemeValues.LIGHT);
                });

                await test.step('WHEN the system turns dark', async () => {
                    await page.emulateMedia({ colorScheme: ColorSchemes.DARK });
                });

                await test.step('THEN the page follows', async () => {
                    await expect
                        .poll(() => documentTheme(page))
                        .toBe(ThemeValues.DARK);
                });

                await test.step('WHEN the visitor chooses light', async () => {
                    await homePage.topBar.clickToggle();
                    await expect
                        .poll(() => documentTheme(page))
                        .toBe(ThemeValues.LIGHT);
                });

                await test.step('THEN later system changes no longer win', async () => {
                    await page.emulateMedia({ colorScheme: ColorSchemes.DARK });
                    await page.emulateMedia({
                        colorScheme: ColorSchemes.LIGHT,
                    });
                    await page.emulateMedia({ colorScheme: ColorSchemes.DARK });
                    await expect
                        .poll(() => documentTheme(page))
                        .toBe(ThemeValues.LIGHT);
                });
            }
        );
    });
});

test.describe('Theme toggle', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    test.beforeEach(async ({ homePage }) => {
        await homePage.open();
    });

    test(
        'should switch the theme, label, address-bar colour and background, and back',
        { tag: '@smoke' },
        async ({ homePage, page }) => {
            const { topBar } = homePage;

            await test.step('WHEN I switch to dark mode', async () => {
                await topBar.switchToDark();
            });

            await test.step('THEN everything turns dark', async () => {
                await expect
                    .poll(() => documentTheme(page))
                    .toBe(ThemeValues.DARK);
                await expect(homePage.pageBody).toHaveCSS(
                    'background-color',
                    ThemeColors.PAGE_BG_DARK
                );
                await expect(topBar.themeToggle).toHaveAccessibleName(
                    ThemeLabels.TO_LIGHT
                );
                await expect
                    .poll(() => themeColorMeta(page))
                    .toBe(ThemeMeta.DARK);
            });

            await test.step('WHEN I switch back to light mode', async () => {
                await topBar.switchToLight();
            });

            await test.step('THEN everything is light again', async () => {
                await expect
                    .poll(() => documentTheme(page))
                    .toBe(ThemeValues.LIGHT);
                await expect(homePage.pageBody).toHaveCSS(
                    'background-color',
                    ThemeColors.PAGE_BG_LIGHT
                );
                await expect(topBar.themeToggle).toHaveAccessibleName(
                    ThemeLabels.TO_DARK
                );
                await expect
                    .poll(() => themeColorMeta(page))
                    .toBe(ThemeMeta.LIGHT);
            });
        }
    );

    test(
        'should show the icon of the mode you will switch to',
        { tag: '@regression' },
        async ({ homePage }) => {
            const { topBar } = homePage;

            await test.step('GIVEN light mode shows the moon', async () => {
                await expect(topBar.moonIcon).toBeVisible();
                await expect(topBar.sunIcon).toBeHidden();
            });

            await test.step('WHEN I switch to dark mode', async () => {
                await topBar.clickToggle();
            });

            await test.step('THEN dark mode shows the sun', async () => {
                await expect(topBar.sunIcon).toBeVisible();
                await expect(topBar.moonIcon).toBeHidden();
            });
        }
    );

    test(
        'should save the choice and keep it after a reload, even against the system setting',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await test.step('WHEN I choose dark on a light system', async () => {
                await homePage.topBar.clickToggle();
                await expect
                    .poll(() => storedTheme(page))
                    .toBe(ThemeValues.DARK);
            });

            await test.step('AND I reload the page', async () => {
                await homePage.reload();
            });

            await test.step('THEN it is still dark', async () => {
                await expect
                    .poll(() => documentTheme(page))
                    .toBe(ThemeValues.DARK);
                await expect(homePage.pageBody).toHaveCSS(
                    'background-color',
                    ThemeColors.PAGE_BG_DARK
                );
                await expect(homePage.topBar.themeToggle).toHaveAccessibleName(
                    ThemeLabels.TO_LIGHT
                );
            });
        }
    );

    test(
        'should be fully usable from the keyboard, in the order brand, Resume, Ask, language, toggle',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            const { topBar } = homePage;

            await test.step('WHEN I press Tab through the top bar', async () => {
                await topBar.pressKey('Tab');
                await expect(topBar.brandLink).toBeFocused();
                await topBar.pressKey('Tab');
                await expect(topBar.resumeLink).toBeFocused();
                await topBar.pressKey('Tab');
                await expect(topBar.askLink).toBeFocused();
                await topBar.pressKey('Tab');
                await expect(topBar.languageSelect).toBeFocused();
                await topBar.pressKey('Tab');
                await expect(topBar.themeToggle).toBeFocused();
            });

            await test.step('AND press Enter on the toggle', async () => {
                await topBar.pressKey('Enter');
            });

            await test.step('THEN the theme switches', async () => {
                await expect
                    .poll(() => documentTheme(page))
                    .toBe(ThemeValues.DARK);
            });
        }
    );
});

test.describe('Theme: first paint and storage', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    test(
        'should apply the saved theme before the first paint (no flash)',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await seedStoredTheme(page, ThemeValues.DARK);
            await homePage.openWithoutWaiting();
            await waitForThemeAttribute(page);
            await expect.poll(() => documentTheme(page)).toBe(ThemeValues.DARK);
        }
    );

    test(
        'should still work when localStorage is unavailable',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await blockLocalStorage(page);
            const errors = collectPageErrors(page);
            await homePage.open();
            await homePage.topBar.clickToggle();
            await expect.poll(() => documentTheme(page)).toBe(ThemeValues.DARK);
            expect(errors).toEqual([]);
        }
    );
});
