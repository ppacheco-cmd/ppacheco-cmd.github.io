import { expect, test } from '../../../fixtures/pom/test-options';
import { documentDataLang, emphasisIn } from '../../../helpers/site/browser';
import { countPdfPages } from '../../../helpers/site/print';
import { containsPhoneNumber } from '../../../helpers/site/privacy';
import { loadTranslations } from '../../../helpers/site/translations';
import { ColorSchemes } from '../../../enums/site/help';
import {
    Anchors,
    BulletCounts,
    I18nTestIds,
    IsoMonthsInOrder,
    OTHER_LANGUAGES,
    TranslatedPrint,
    Unchanged,
} from '../../../enums/site/i18n';
import { ResumeLinks } from '../../../enums/site/resume';

const { dictionaries, months } = loadTranslations();

/** The month number of July (the Euronext job starts in July 2026), zero-based */
const JULY_INDEX = 6;

for (const code of OTHER_LANGUAGES) {
    const x = Anchors[code];
    const dictionary = dictionaries[code];

    test.describe(`Resume page in ${code}`, () => {
        test.use({ colorScheme: ColorSchemes.LIGHT, locale: 'en-US' });

        test.beforeEach(async ({ resumePage, page }) => {
            await resumePage.open();
            await resumePage.topBar.selectLanguage(code);
            await expect.poll(() => documentDataLang(page)).toBe(code);
        });

        test(
            'should translate the title, headings, summary and download button',
            { tag: '@smoke' },
            async ({ resumePage, page }) => {
                await expect(page).toHaveTitle(x.resumeTitle);
                await expect(resumePage.sectionHeadings).toHaveText([
                    dictionary.strings['r.h.summary'],
                    dictionary.strings['r.h.skills'],
                    dictionary.strings['r.h.education'],
                    x.experienceHeading,
                    dictionary.strings['r.h.projects'],
                    dictionary.strings['r.h.publications'],
                    x.languagesHeading,
                ]);
                await expect(resumePage.summaryText).toHaveText(
                    dictionary.strings['r.summary']
                );
                await expect(resumePage.cvButton.button).toHaveAccessibleName(
                    x.cvIdleResume
                );
                await expect(
                    resumePage.topBar.navLinkNamed(x.navResume)
                ).toHaveAttribute('aria-current', ResumeLinks.CURRENT_PAGE);
            }
        );

        test(
            'should translate dates, "current", durations and tool labels, and keep the machine-readable months',
            { tag: '@regression' },
            async ({ resumePage }) => {
                await expect(
                    resumePage.euronextJob.getByTestId(I18nTestIds.JOB_DATES)
                ).toContainText(`${months[code][JULY_INDEX]} 2026`);
                await expect(
                    resumePage.euronextJob.getByTestId(I18nTestIds.JOB_DATES)
                ).toContainText(x.current);
                await expect(
                    resumePage.promptlyQaJob.getByTestId(I18nTestIds.JOB_DATES)
                ).toContainText(x.qaDates);
                await expect(
                    resumePage.promptlyQaJob.getByTestId(
                        I18nTestIds.JOB_DURATION
                    )
                ).toHaveText(x.qaDuration);
                await expect(
                    resumePage.euronextJob.getByTestId(
                        I18nTestIds.JOB_TOOLS_LABEL
                    )
                ).toHaveText(x.tools);
                expect(await resumePage.isoMonths()).toEqual([
                    ...IsoMonthsInOrder,
                ]);
            }
        );

        test(
            'should translate every bullet, keep bold and italic parts, and keep the facts',
            { tag: '@regression' },
            async ({ resumePage }) => {
                for (const [prefix, count] of Object.entries(BulletCounts)) {
                    for (let number = 1; number <= count; number += 1) {
                        const key = `${prefix}.b${number}`;
                        await expect(resumePage.bullet(key)).toHaveText(
                            dictionary.strings[key].replace(/\*\*|__/g, '')
                        );
                    }
                }
                const euronext = await emphasisIn(resumePage.bullet('r.eu.b1'));
                expect(euronext.em).toEqual(['XRay']);
                const promptly = await emphasisIn(resumePage.bullet('r.pq.b1'));
                expect(promptly.strong).toHaveLength(1);
                await expect(resumePage.promptlyQaJob).not.toContainText(
                    Unchanged.UNVERIFIED_COVERAGE
                );
                await expect(resumePage.promptlyBackendJob).not.toContainText(
                    Unchanged.REMOVED_DELIVERY_GAIN
                );
                await expect(resumePage.promptlyBackendJob).toContainText(
                    x.mentalHealth
                );
                await expect(resumePage.projectArticle).toContainText(
                    Unchanged.PROJECT_RESULT
                );
                await expect(resumePage.languagesRegion).toContainText(
                    Unchanged.LANGUAGE_LEVEL
                );
            }
        );

        test(
            'should keep names, links and tool lists unchanged',
            { tag: '@regression' },
            async ({ resumePage, page }) => {
                await expect(resumePage.euronextJob).toContainText(
                    Unchanged.EURONEXT
                );
                await expect(
                    page.getByRole('link', { name: Unchanged.ISTQB_LINK })
                ).toBeVisible();
                await expect(
                    resumePage.promptlyQaJob.getByTestId(I18nTestIds.JOB_TOOLS)
                ).toContainText(Unchanged.PROMPTLY_QA_TOOLS);
                await expect(
                    resumePage.publications.filter({
                        hasText: Unchanged.PUBLICATION_TITLE,
                    })
                ).toHaveCount(1);
                await expect(resumePage.emailLink).toHaveAttribute(
                    'href',
                    new RegExp(Unchanged.MAILTO)
                );
            }
        );

        test(
            'should contain no phone number in this language',
            { tag: '@regression' },
            async ({ resumePage }) => {
                expect(containsPhoneNumber(await resumePage.bodyText())).toBe(
                    false
                );
            }
        );
    });

    test.describe(`Resume page printed in ${code}`, () => {
        test.use({ colorScheme: ColorSchemes.DARK });

        test(
            'should print to two pages, like the English version',
            { tag: '@regression' },
            async ({ resumePage, page }) => {
                await resumePage.openWithLanguage(code);
                await expect.poll(() => documentDataLang(page)).toBe(code);
                const pdf = await resumePage.printToPdf();
                expect(countPdfPages(pdf)).toBe(TranslatedPrint.PAGES);
            }
        );
    });
}
