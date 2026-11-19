import { expect, test } from '../../../fixtures/pom/test-options';
import {
    countNavigations,
    documentDataLang,
    documentLangTag,
    optionAttributes,
} from '../../../helpers/site/browser';
import { ColorSchemes } from '../../../enums/site/help';
import { LanguageCodes } from '../../../enums/site/site';
import { EnglishAnchors, SwitcherOptions } from '../../../enums/site/i18n';

test.describe('Language switcher', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT, locale: 'en-US' });

    test.beforeEach(async ({ homePage }) => {
        await homePage.open();
    });

    test(
        'should be a labelled "Language" select with the four languages, English first and selected',
        { tag: '@smoke' },
        async ({ homePage, page }) => {
            const { topBar } = homePage;
            await expect(topBar.languageSelect).toHaveCount(1);
            await expect(topBar.languageSelect).toHaveAccessibleName(
                EnglishAnchors.langLabel
            );
            await expect(topBar.languageSelect).toHaveValue(LanguageCodes.EN);
            await expect(topBar.languageSelect.getByRole('option')).toHaveText([
                ...SwitcherOptions.labels,
            ]);
            const attributes = await optionAttributes(topBar.languageSelect);
            expect(attributes.langs).toEqual([
                ...SwitcherOptions.langAttributes,
            ]);
            expect(attributes.values).toEqual([...SwitcherOptions.values]);
            await expect(topBar.languageCode).toHaveText(EnglishAnchors.short);
            await expect
                .poll(() => documentLangTag(page))
                .toBe(EnglishAnchors.tag);
        }
    );

    test(
        'should sit in the top bar between the navigation and the theme toggle',
        { tag: '@regression' },
        async ({ homePage }) => {
            await expect(homePage.topBar.languageSwitcher).toBeVisible();
            await homePage.topBar.switcherSitsBetweenNavAndToggleAndVerify();
        }
    );

    test(
        'should switch language without reloading the page',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            const navigations = countNavigations(page);
            await homePage.topBar.selectLanguage(LanguageCodes.FR);
            await expect
                .poll(() => documentDataLang(page))
                .toBe(LanguageCodes.FR);
            expect(navigations()).toBe(0);
            expect(new URL(page.url()).search).toBe('');
        }
    );

    test(
        'should keep the document language tag valid for every option',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            for (const [index, code] of SwitcherOptions.values.entries()) {
                await homePage.topBar.selectLanguage(code);
                await expect
                    .poll(() => documentLangTag(page))
                    .toBe(SwitcherOptions.langAttributes[index]);
            }
        }
    );
});

test.describe('Language switcher without JavaScript', () => {
    test.use({
        javaScriptEnabled: false,
        colorScheme: ColorSchemes.LIGHT,
        locale: 'fr-FR',
    });

    test(
        'should be hidden (it could not work) while the English page stays intact',
        { tag: '@regression' },
        async ({ homePage }) => {
            await homePage.open();
            await expect(homePage.topBar.languageSwitcher).toBeHidden();
            await expect(homePage.askHeading).toBeVisible();
        }
    );
});
