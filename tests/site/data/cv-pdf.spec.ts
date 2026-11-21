import { expect, test } from '../../../fixtures/pom/test-options';
import { readPdf, normalizeForComparison } from '../../../helpers/site/pdf';
import { containsPhoneNumber } from '../../../helpers/site/privacy';
import { loadTranslations } from '../../../helpers/site/translations';
import { BulletCounts } from '../../../enums/site/i18n';
import { CvPdfRules } from '../../../enums/site/projects';
import { ResumeJobs } from '../../../enums/site/resume';
import { ResumeSkills } from '../../../enums/site/site';

const english = loadTranslations().dictionaries.en.strings;

/** The web resume writes bold as ** and italic as __; the PDF has neither */
const plain = (text: string): string =>
    normalizeForComparison(text.replace(/\*\*|__/g, ''));

/**
 * The CV people download must say what the web resume says. A stale PDF once
 * kept claims that had been removed from the site; these checks stop that.
 */
test.describe('Downloadable CV matches the web resume', () => {
    test(
        'should have the expected number of pages',
        { tag: '@sanity' },
        async () => {
            const cv = await readPdf(CvPdfRules.FILE);
            expect(cv.pages).toBe(CvPdfRules.PAGES);
        }
    );

    test(
        'should contain the summary and the skills lines of the web resume',
        { tag: '@sanity' },
        async () => {
            const cv = await readPdf(CvPdfRules.FILE);
            expect(cv.text).toContain(plain(english['r.summary']));
            for (const line of Object.values(ResumeSkills)) {
                expect(cv.text).toContain(plain(line));
            }
        }
    );

    for (const [prefix, count] of Object.entries(BulletCounts)) {
        test(
            `should contain every ${prefix} bullet of the web resume`,
            { tag: '@sanity' },
            async () => {
                const cv = await readPdf(CvPdfRules.FILE);
                const missing = Array.from(
                    { length: count },
                    (_, index) => `${prefix}.b${index + 1}`
                ).filter((key) => !cv.text.includes(plain(english[key])));
                expect(missing).toEqual([]);
            }
        );
    }

    test(
        'should name the same employers and dates as the web resume',
        { tag: '@sanity' },
        async () => {
            const cv = await readPdf(CvPdfRules.FILE);
            for (const fact of [
                ResumeJobs.EURONEXT,
                ResumeJobs.EURONEXT_DATES,
                ResumeJobs.PROMPTLY,
                ResumeJobs.QA_DATES,
                ResumeJobs.BACKEND_DATES,
            ]) {
                expect(cv.text).toContain(fact);
            }
        }
    );

    test(
        'should not bring back removed claims, and should not contain a phone number',
        { tag: '@sanity' },
        async () => {
            const cv = await readPdf(CvPdfRules.FILE);
            for (const claim of CvPdfRules.REMOVED_CLAIMS) {
                expect(cv.text).not.toContain(claim);
            }
            expect(containsPhoneNumber(cv.text)).toBe(false);
        }
    );
});
