import { expect, test } from '../../../fixtures/pom/test-options';
import {
    charactersOutsideRanges,
    fontUnicodeRanges,
} from '../../../helpers/site/fonts';
import { PAGE_OF, PAGES } from '../../../helpers/site/page-lookup';
import {
    allTexts,
    blockPageScripts,
    driftedKeys,
    genderedEntries,
    loadTranslations,
    lostNumbers,
    lostProductNames,
    missingKeys,
    rawTranslatableText,
    textProblems,
    translationKeysUsedInPages,
    untranslatedEntries,
} from '../../../helpers/site/translations';
import { FontFiles } from '../../../enums/site/fonts';
import {
    ALL_LANGUAGES,
    I18nCounts,
    OTHER_LANGUAGES,
    ProductNames,
    SameAsEnglish,
} from '../../../enums/site/i18n';
import { ColorSchemes } from '../../../enums/site/help';

const { dictionaries, months } = loadTranslations();
const english = dictionaries.en;

/** Names that may equal the English in each language (kept in English on purpose) */
const ALLOWED_SAME: Record<string, Set<string>> = {
    pt: new Set<string>(SameAsEnglish.all),
    es: new Set<string>(SameAsEnglish.all),
    fr: new Set<string>([...SameAsEnglish.all, ...SameAsEnglish.fr]),
};

test.describe('Translation data: structure', () => {
    test(
        'should have exactly the same keys and the same questions in all four languages',
        { tag: '@sanity' },
        () => {
            const base = Object.keys(english.strings).sort();
            const ids = english.qa.map((item) => item.id);
            for (const code of OTHER_LANGUAGES) {
                expect(Object.keys(dictionaries[code].strings).sort()).toEqual(
                    base
                );
                expect(dictionaries[code].qa.map((item) => item.id)).toEqual(
                    ids
                );
            }
            expect(ids).toHaveLength(I18nCounts.QUESTIONS);
        }
    );

    for (const code of ALL_LANGUAGES) {
        test(
            `should have a value in ${code} for every key the pages use`,
            { tag: '@sanity' },
            () => {
                const used = translationKeysUsedInPages();
                expect(used.size).toBeGreaterThan(I18nCounts.MIN_PAGE_KEYS);
                expect(missingKeys(dictionaries[code], used)).toEqual([]);
            }
        );

        test(
            `should have no empty values, balanced bold/italic marks and no leftovers in ${code}`,
            { tag: '@sanity' },
            () => {
                expect(textProblems(dictionaries[code])).toEqual([]);
            }
        );
    }
});

test.describe('Translation data: quality', () => {
    for (const code of OTHER_LANGUAGES) {
        test(
            `should really translate ${code} (only a few short names may equal the English)`,
            { tag: '@sanity' },
            () => {
                expect(
                    untranslatedEntries(
                        english,
                        dictionaries[code],
                        ALLOWED_SAME[code]
                    )
                ).toEqual([]);
            }
        );

        test(
            `should keep every number from the English text in ${code} (facts are preserved)`,
            { tag: '@sanity' },
            () => {
                expect(lostNumbers(english, dictionaries[code])).toEqual([]);
            }
        );

        test(
            `should keep product and tool names in ${code}`,
            { tag: '@sanity' },
            () => {
                expect(
                    lostProductNames(english, dictionaries[code], ProductNames)
                ).toEqual([]);
            }
        );

        test(
            `should keep the wording of ${code} gender-neutral and the title "QA Engineer"`,
            { tag: '@sanity' },
            () => {
                expect(dictionaries[code].strings['c.role']).toBe(
                    english.strings['c.role']
                );
                expect(genderedEntries(dictionaries[code])).toEqual([]);
            }
        );
    }

    test(
        'should only use characters the site font can set, in every language',
        { tag: '@sanity' },
        async ({ request }) => {
            const css = await (await request.get(FontFiles.STYLESHEET)).text();
            const everything = ALL_LANGUAGES.map(
                (code) =>
                    allTexts(dictionaries[code])
                        .map(([, text]) => text)
                        .join(' ') + (months[code] ?? []).join(' ')
            ).join(' ');
            expect(
                charactersOutsideRanges(everything, fontUnicodeRanges(css))
            ).toEqual([]);
        }
    );
});

test.describe('Translation data: English has not drifted from the pages', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    for (const { name, pick } of PAGES) {
        test(
            `should match the English text written in the ${name}`,
            { tag: '@sanity' },
            async ({ homePage, resumePage, page }) => {
                await blockPageScripts(page);
                await PAGE_OF[pick]({ homePage, resumePage }).open();
                const found = await rawTranslatableText(page);
                expect(Object.keys(found).length).toBeGreaterThan(
                    I18nCounts.MIN_RAW_KEYS
                );
                expect(driftedKeys(found, english)).toEqual([]);
            }
        );
    }
});
