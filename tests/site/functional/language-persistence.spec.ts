import { expect, test } from '../../../fixtures/pom/test-options';
import { scanAccessibility } from '../../../helpers/site/a11y';
import {
    abortRequestsMatching,
    bodyVisibility,
    documentDataLang,
    documentTheme,
    holdRequestsMatching,
    isAwaitingTranslation,
} from '../../../helpers/site/browser';
import { horizontalOverflow } from '../../../helpers/site/layout';
import { PAGE_OF, PAGES } from '../../../helpers/site/page-lookup';
import { loadTranslations } from '../../../helpers/site/translations';
import { A11yViewports } from '../../../enums/site/a11y';
import { ColorSchemes, LayoutLimits } from '../../../enums/site/help';
import {
    ALL_LANGUAGES,
    Anchors,
    EnglishAnchors,
    OTHER_LANGUAGES,
    QuestionIndex,
    SmallPhoneHeight,
    SmallPhoneWidths,
} from '../../../enums/site/i18n';
import { LanguageCodes, ThemeValues } from '../../../enums/site/site';
import { MotionPreferences } from '../../../enums/site/theme';

const { dictionaries } = loadTranslations();

/** Glob of the translation file, to hold it back or make it fail */
const TRANSLATION_FILE = '**/assets/i18n.js';

test.describe('The language choice carries across pages and sessions', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT, locale: 'en-US' });

    test(
        'should keep the language when moving between the home and resume pages',
        { tag: '@regression' },
        async ({ homePage, resumePage, page }) => {
            await homePage.open();

            await test.step('WHEN I choose French and open the resume from the menu', async () => {
                await homePage.topBar.selectLanguage(LanguageCodes.FR);
                await homePage.topBar
                    .navLinkNamed(Anchors.fr.navResume)
                    .click();
            });

            await test.step('THEN the resume is in French', async () => {
                await expect(page).toHaveURL(/resume\.html$/);
                await expect
                    .poll(() => documentDataLang(page))
                    .toBe(LanguageCodes.FR);
                await expect(resumePage.topBar.languageSelect).toHaveValue(
                    LanguageCodes.FR
                );
                await expect(
                    resumePage.sectionHeading(Anchors.fr.summaryHeading)
                ).toBeVisible();
            });

            await test.step('WHEN I choose Portuguese and go back home', async () => {
                await resumePage.topBar.selectLanguage(LanguageCodes.PT);
                await resumePage.topBar.clickBrand();
            });

            await test.step('THEN the home page is in Portuguese', async () => {
                await expect(
                    homePage.askHeadingNamed(Anchors.pt.askTitle)
                ).toBeVisible();
            });
        }
    );

    test(
        'should keep language and theme as independent choices',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await homePage.open();
            await homePage.topBar.clickToggle();
            await homePage.topBar.selectLanguage(LanguageCodes.ES);
            await expect.poll(() => documentTheme(page)).toBe(ThemeValues.DARK);
            await homePage.reload();
            await expect.poll(() => documentTheme(page)).toBe(ThemeValues.DARK);
            await expect
                .poll(() => documentDataLang(page))
                .toBe(LanguageCodes.ES);
            await expect(homePage.topBar.themeToggle).toHaveAttribute(
                'aria-label',
                Anchors.es.toLight
            );
        }
    );

    test(
        'should restore the original English text exactly when switching back to English',
        { tag: '@regression' },
        async ({ resumePage }) => {
            await resumePage.open();
            const before = await resumePage.mainText();
            await resumePage.topBar.selectLanguage(LanguageCodes.FR);
            await expect(
                resumePage.sectionHeading(Anchors.fr.summaryHeading)
            ).toBeVisible();
            await resumePage.topBar.selectLanguage(LanguageCodes.EN);
            await expect(
                resumePage.sectionHeading(EnglishAnchors.summaryHeading)
            ).toBeVisible();
            expect(await resumePage.mainText()).toBe(before);
        }
    );
});

test.describe('No flash of English, and no page stuck hidden', () => {
    test.describe('with a French browser', () => {
        test.use({ locale: 'fr-FR', colorScheme: ColorSchemes.LIGHT });

        test(
            'should hide a non-English page until it is translated, then show it',
            { tag: '@regression' },
            async ({ homePage, page }) => {
                const release = await holdRequestsMatching(
                    page,
                    TRANSLATION_FILE
                );
                await homePage.openWithoutWaiting();

                await test.step('GIVEN the translation has not arrived', async () => {
                    await expect
                        .poll(() => isAwaitingTranslation(page))
                        .toBe(true);
                    await expect
                        .poll(() => bodyVisibility(page))
                        .toBe('hidden');
                });

                await test.step('WHEN the translation arrives', async () => {
                    release();
                });

                await test.step('THEN the translated page is shown', async () => {
                    await expect(
                        homePage.askHeadingNamed(Anchors.fr.askTitle)
                    ).toBeVisible();
                    await expect
                        .poll(() => isAwaitingTranslation(page))
                        .toBe(false);
                    await expect
                        .poll(() => bodyVisibility(page))
                        .toBe('visible');
                });
            }
        );
    });

    test.describe('with a Portuguese browser', () => {
        test.use({ locale: 'pt-PT', colorScheme: ColorSchemes.LIGHT });

        test(
            'should still show the page, in English, when the translations fail to load',
            { tag: '@regression' },
            async ({ homePage, page }) => {
                await abortRequestsMatching(page, TRANSLATION_FILE);
                await homePage.open();
                await expect(homePage.askHeading).toBeVisible();
                await expect.poll(() => bodyVisibility(page)).toBe('visible');
                await expect(homePage.topBar.themeToggle).toHaveAttribute(
                    'aria-label',
                    /mode/i
                );
            }
        );
    });

    test.describe('with an English browser', () => {
        test.use({ locale: 'en-US' });

        test(
            'should never hide English visitors',
            { tag: '@regression' },
            async ({ homePage, page }) => {
                await homePage.open();
                await expect(homePage.askHeading).toBeVisible();
                expect(await isAwaitingTranslation(page)).toBe(false);
            }
        );
    });
});

test.describe('The top bar fits every language on small phones', () => {
    for (const width of SmallPhoneWidths) {
        for (const code of ALL_LANGUAGES) {
            for (const { name, pick } of PAGES) {
                test.describe(`${code} on the ${name} at ${width}px`, () => {
                    test.use({
                        viewport: { width, height: SmallPhoneHeight.HEIGHT },
                        colorScheme: ColorSchemes.LIGHT,
                    });

                    test(
                        'should neither overflow nor overlap',
                        { tag: '@regression' },
                        async ({ homePage, resumePage, page }) => {
                            const subject = PAGE_OF[pick]({
                                homePage,
                                resumePage,
                            });
                            await subject.openWithLanguage(code);
                            await expect
                                .poll(() => documentDataLang(page))
                                .toBe(code);
                            expect(
                                await horizontalOverflow(page)
                            ).toBeLessThanOrEqual(
                                LayoutLimits.MAX_HORIZONTAL_OVERFLOW
                            );
                            await subject.topBar.fitsWithoutOverlapAndVerify(
                                width
                            );
                        }
                    );
                });
            }
        }
    }
});

test.describe('Accessibility (axe) in every language', () => {
    for (const code of OTHER_LANGUAGES) {
        for (const { label, viewport, scheme } of [
            {
                label: 'desktop light',
                viewport: A11yViewports.desktop,
                scheme: ColorSchemes.LIGHT,
            },
            {
                label: 'phone dark',
                viewport: A11yViewports.phone,
                scheme: ColorSchemes.DARK,
            },
        ]) {
            test.describe(`${code}, ${label}`, () => {
                test.use({
                    viewport,
                    colorScheme: scheme,
                    reducedMotion: MotionPreferences.REDUCE,
                });

                test(
                    'should have no violations on the home page with an answer and the help open',
                    { tag: '@regression' },
                    async ({ homePage, page }) => {
                        await homePage.openWithLanguage(code);
                        await expect
                            .poll(() => documentDataLang(page))
                            .toBe(code);
                        await homePage.clickChip(
                            dictionaries[code].qa[QuestionIndex.SECOND].q
                        );
                        await homePage.help
                            .buttonNamed(Anchors[code].help)
                            .click();
                        await expect(homePage.help.panel).toBeVisible();
                        const { violations } = await scanAccessibility(page);
                        expect(
                            violations.map(
                                (violation) =>
                                    `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`
                            )
                        ).toEqual([]);
                    }
                );

                test(
                    'should have no violations on the resume page',
                    { tag: '@regression' },
                    async ({ resumePage, page }) => {
                        await resumePage.openWithLanguage(code);
                        await expect
                            .poll(() => documentDataLang(page))
                            .toBe(code);
                        const { violations } = await scanAccessibility(page);
                        expect(
                            violations.map(
                                (violation) =>
                                    `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`
                            )
                        ).toEqual([]);
                    }
                );
            });
        }
    }
});
