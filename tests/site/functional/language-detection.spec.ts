import { expect, test } from '../../../fixtures/pom/test-options';
import {
    documentDataLang,
    documentLangTag,
    setNavigatorLanguages,
    storedLanguage,
} from '../../../helpers/site/browser';
import { ColorSchemes } from '../../../enums/site/help';
import { LanguageCodes } from '../../../enums/site/site';
import {
    Anchors,
    BrowserLocaleCases,
    LangParameters,
    PreferenceList,
} from '../../../enums/site/i18n';

test.describe('Choosing the language from the browser', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    for (const { locale, code, tag } of BrowserLocaleCases) {
        test.describe(`browser language ${locale}`, () => {
            test.use({ locale });

            test(
                `should open the site in "${code}" with lang="${tag}"`,
                { tag: '@regression' },
                async ({ homePage, page }) => {
                    await homePage.open();
                    await expect.poll(() => documentDataLang(page)).toBe(code);
                    await expect.poll(() => documentLangTag(page)).toBe(tag);
                    await expect(homePage.topBar.languageSelect).toHaveValue(
                        code
                    );
                }
            );
        });
    }

    test.describe('with a preference list', () => {
        test.use({ locale: PreferenceList.LOCALE });

        test(
            'should use the first supported language in the list',
            { tag: '@regression' },
            async ({ homePage, page }) => {
                await setNavigatorLanguages(page, PreferenceList.LANGUAGES);
                await homePage.open();
                await expect
                    .poll(() => documentDataLang(page))
                    .toBe(PreferenceList.EXPECTED);
            }
        );
    });

    test.describe('with a Spanish browser', () => {
        test.use({ locale: 'es-ES' });

        test(
            'should let an explicit choice beat the browser language, and remember it',
            { tag: '@regression' },
            async ({ homePage, page }) => {
                await homePage.open();
                await expect(homePage.topBar.languageSelect).toHaveValue(
                    LanguageCodes.ES
                );
                await homePage.topBar.selectLanguage(LanguageCodes.EN);
                await expect
                    .poll(() => storedLanguage(page))
                    .toBe(LanguageCodes.EN);
                await homePage.reload();
                await expect
                    .poll(() => documentDataLang(page))
                    .toBe(LanguageCodes.EN);
                await expect(homePage.askHeading).toBeVisible();
            }
        );
    });
});

test.describe('?lang= in the address', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT, locale: 'en-US' });

    test(
        'should open in Portuguese and remember it for other pages',
        { tag: '@regression' },
        async ({ homePage, resumePage, page }) => {
            await homePage.openWithLanguage(LangParameters.PORTUGUESE);
            await expect
                .poll(() => documentDataLang(page))
                .toBe(LangParameters.PORTUGUESE);
            await expect
                .poll(() => storedLanguage(page))
                .toBe(LangParameters.PORTUGUESE);
            await resumePage.open();
            await expect(
                resumePage.sectionHeading(Anchors.pt.experienceHeading)
            ).toBeVisible();
        }
    );

    test(
        'should override a saved choice',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await homePage.openWithLanguage(LangParameters.FRENCH);
            await homePage.openWithLanguage(LangParameters.SPANISH);
            await expect
                .poll(() => documentDataLang(page))
                .toBe(LangParameters.SPANISH);
        }
    );

    test(
        'should accept upper case and region codes',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await homePage.openWithLanguage(LangParameters.MIXED_CASE_REGION);
            await expect
                .poll(() => documentDataLang(page))
                .toBe(LangParameters.PORTUGUESE);
        }
    );

    test(
        'should ignore an unknown language and save nothing',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await homePage.openWithLanguage(LangParameters.UNKNOWN);
            await expect
                .poll(() => documentDataLang(page))
                .toBe(LanguageCodes.EN);
            expect(await storedLanguage(page)).toBeNull();
            await homePage.openWithLanguage(LangParameters.SCRIPT_INJECTION);
            await expect
                .poll(() => documentDataLang(page))
                .toBe(LanguageCodes.EN);
        }
    );
});
