import { expect, test } from '../../../fixtures/pom/test-options';
import { horizontalOverflow } from '../../../helpers/site/layout';
import { countPdfPages } from '../../../helpers/site/print';
import { containsPhoneNumber } from '../../../helpers/site/privacy';
import { extractStructuredData } from '../../../helpers/site/structured-data';
import {
    ColorSchemes,
    LayoutLimits,
    PhoneViewport,
    ThemeColors,
} from '../../../enums/site/help';
import {
    PrintColors,
    ResumeCounts,
    ResumeFacts,
    ResumeJobs,
    ResumeLinks,
    StructuredDataRules,
} from '../../../enums/site/resume';
import {
    HomeText,
    PageTitles,
    ResumeSections,
    ResumeSkills,
    SiteRoutes,
} from '../../../enums/site/site';

/** Three-letter month and year, e.g. "Jul 2026" */
const SHORT_DATE = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/;

/** Machine-readable month, e.g. "2026-07" */
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Turns a link path such as `github.com/user` into a pattern that matches inside a URL */
const inUrl = (path: string): RegExp =>
    new RegExp(path.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'));

test.describe('Resume page', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    test.beforeEach(async ({ resumePage }) => {
        await resumePage.open();
    });

    test(
        'should show the title, the name and the role',
        { tag: '@smoke' },
        async ({ resumePage, page }) => {
            await expect(page).toHaveTitle(PageTitles.RESUME);
            await expect(resumePage.nameHeading).toHaveText(HomeText.NAME);
            await expect(resumePage.help.roleLabel).toHaveText(HomeText.ROLE);
        }
    );

    test(
        'should list the sections in the same order as the CV, as plain headings',
        { tag: '@smoke' },
        async ({ resumePage }) => {
            await test.step('THEN the sections follow the CV order', async () => {
                await expect(resumePage.sectionHeadings).toHaveText(
                    Object.values(ResumeSections)
                );
            });

            await test.step('AND the headings are sentence case, not tracked-out capitals', async () => {
                await expect(
                    resumePage.sectionHeading(ResumeSections.SUMMARY)
                ).toHaveCSS('text-transform', 'none');
            });
        }
    );

    test(
        'should show the skills lines exactly as on the CV',
        { tag: '@regression' },
        async ({ resumePage }) => {
            await expect(resumePage.skillLines).toHaveText(
                Object.values(ResumeSkills)
            );
        }
    );

    test(
        'should use one date format: three-letter months',
        { tag: '@regression' },
        async ({ resumePage }) => {
            await test.step('THEN every date is a three-letter month and a year', async () => {
                const dates = await resumePage.dates.allTextContents();
                for (const date of dates) {
                    expect(date).toMatch(SHORT_DATE);
                }
            });

            await test.step('AND the current job says Present, not Current', async () => {
                await expect(
                    resumePage.job(ResumeJobs.EURONEXT)
                ).not.toContainText(ResumeJobs.OLD_CURRENT_LABEL);
            });
        }
    );

    test(
        'should list the three jobs with the right dates and durations',
        { tag: '@regression' },
        async ({ resumePage }) => {
            await expect(resumePage.jobs).toHaveCount(ResumeCounts.JOBS);

            const euronext = resumePage.job(ResumeJobs.EURONEXT);
            await expect(euronext).toContainText(ResumeJobs.EURONEXT_VIA);
            await expect(euronext).toContainText(ResumeJobs.EURONEXT_DATES);

            const qa = resumePage
                .job(ResumeJobs.PROMPTLY)
                .filter({ hasText: ResumeJobs.QA_DATES });
            await expect(qa).toContainText(ResumeJobs.QA_ROLE);
            await expect(qa).toContainText(ResumeJobs.QA_DURATION);

            const backend = resumePage.job(ResumeJobs.BACKEND_ROLE);
            await expect(backend).toContainText(ResumeJobs.BACKEND_DATES);
            await expect(backend).toContainText(ResumeJobs.BACKEND_DURATION);
        }
    );

    test(
        'should contain the key facts from the CV',
        { tag: '@regression' },
        async ({ resumePage }) => {
            for (const fact of Object.values(ResumeFacts)) {
                await expect(resumePage.mainContent).toContainText(fact);
            }
        }
    );

    test(
        'should not expose a phone number',
        { tag: '@regression' },
        async ({ resumePage }) => {
            await test.step('THEN neither the visible text nor the source has one', async () => {
                expect(
                    containsPhoneNumber(await resumePage.visibleText())
                ).toBe(false);
                const html = await resumePage.sourceHtml();
                expect(containsPhoneNumber(html)).toBe(false);
                expect(html).not.toContain('tel:');
            });
        }
    );

    test(
        'should have correct contact and download links',
        { tag: '@regression' },
        async ({ resumePage }) => {
            await expect(resumePage.emailLink).toHaveAttribute(
                'href',
                new RegExp(`^${ResumeLinks.MAILTO_PREFIX}`)
            );
            await expect(resumePage.linkedInLink).toHaveAttribute(
                'href',
                inUrl(ResumeLinks.LINKEDIN_PATH)
            );
            await expect(resumePage.linkedInLink).toHaveAttribute(
                'rel',
                new RegExp(ResumeLinks.SAFE_REL)
            );
            await expect(resumePage.gitHubLink).toHaveAttribute(
                'href',
                inUrl(ResumeLinks.GITHUB_PATH)
            );
            await expect(resumePage.pdfLink).toHaveAttribute(
                'href',
                ResumeLinks.PDF_HREF
            );
            await expect(resumePage.pdfLink).toHaveAttribute(
                'download',
                ResumeLinks.PDF_FILE
            );
        }
    );

    test(
        'should open every external link safely in a new tab',
        { tag: '@regression' },
        async ({ resumePage }) => {
            const checked = await resumePage.externalLinksOpenSafelyAndVerify();
            expect(checked).toBeGreaterThan(ResumeCounts.MIN_EXTERNAL_LINKS);
        }
    );

    test(
        'should mark Resume as the current page and link back home',
        { tag: '@regression' },
        async ({ resumePage, page }) => {
            await expect(resumePage.topBar.resumeLink).toHaveAttribute(
                'aria-current',
                ResumeLinks.CURRENT_PAGE
            );
            await resumePage.topBar.clickBrand();
            await expect(page).toHaveURL(/\/(index\.html)?$/);
        }
    );

    test(
        'should have a valid machine-readable month on every date',
        { tag: '@regression' },
        async ({ resumePage }) => {
            const months = await resumePage.isoMonths();
            expect(months).toHaveLength(ResumeCounts.TIME_ELEMENTS);
            for (const month of months) {
                expect(month).toMatch(ISO_MONTH);
            }
        }
    );
});

test.describe('Resume structured data', () => {
    test(
        'should describe the person without contact details',
        { tag: '@regression' },
        async ({ request }) => {
            const html = await (await request.get(SiteRoutes.RESUME)).text();
            const structured = extractStructuredData(html);
            expect(structured).not.toBeNull();
            expect(structured?.data['@type']).toBe(StructuredDataRules.TYPE);
            expect(structured?.data.name).toBe(HomeText.NAME);
            expect(structured?.data.jobTitle).toBe(
                StructuredDataRules.JOB_TITLE
            );
            expect(JSON.stringify(structured?.data.sameAs)).toMatch(
                inUrl(ResumeLinks.GITHUB_PATH)
            );
            expect(structured?.raw).not.toMatch(
                new RegExp(StructuredDataRules.FORBIDDEN_FIELDS, 'i')
            );
            expect(containsPhoneNumber(structured?.raw ?? '')).toBe(false);
        }
    );
});

test.describe('Resume page: theme and print', () => {
    test.describe('theme chosen on the home page', () => {
        test.use({ colorScheme: ColorSchemes.LIGHT });

        test(
            'should carry over to the resume page',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                await test.step('GIVEN I switch to dark mode on the home page', async () => {
                    await homePage.open();
                    await homePage.topBar.switchToDark();
                    await expect(
                        homePage.topBar.switchToLightButton
                    ).toBeVisible();
                });

                await test.step('WHEN I go to the resume page', async () => {
                    await homePage.topBar.clickResume();
                });

                await test.step('THEN it is dark too', async () => {
                    await expect(
                        resumePage.topBar.switchToLightButton
                    ).toBeVisible();
                    await expect(resumePage.pageBody).toHaveCSS(
                        'background-color',
                        ThemeColors.PAGE_BG_DARK
                    );
                });
            }
        );
    });

    test.describe('on a dark system', () => {
        test.use({ colorScheme: ColorSchemes.DARK });

        test(
            'should let the toggle switch the resume page to light',
            { tag: '@regression' },
            async ({ resumePage }) => {
                await resumePage.open();

                await test.step('GIVEN the page starts dark', async () => {
                    await expect(
                        resumePage.topBar.switchToLightButton
                    ).toBeVisible();
                });

                await test.step('WHEN I use the toggle', async () => {
                    await resumePage.topBar.switchToLight();
                });

                await test.step('THEN the page is light', async () => {
                    await expect(
                        resumePage.topBar.switchToDarkButton
                    ).toBeVisible();
                    await expect(resumePage.pageBody).toHaveCSS(
                        'background-color',
                        ThemeColors.PAGE_BG_LIGHT
                    );
                });
            }
        );

        test(
            'should print black on white without the top bar or the download button, even in dark mode',
            { tag: '@regression' },
            async ({ resumePage }) => {
                await resumePage.open();
                await expect(
                    resumePage.topBar.switchToLightButton
                ).toBeVisible();

                await test.step('WHEN the page is printed', async () => {
                    await resumePage.emulatePrint();
                });

                await test.step('THEN the chrome is hidden and the page is black on white', async () => {
                    await expect(resumePage.topBar.banner).toBeHidden();
                    await expect(resumePage.pdfLink).toBeHidden();
                    await expect(resumePage.pageBody).toHaveCSS(
                        'background-color',
                        ThemeColors.PAGE_BG_LIGHT
                    );
                    await expect(resumePage.pageBody).toHaveCSS(
                        'color',
                        PrintColors.INK
                    );
                });
            }
        );

        test(
            'should print to a compact PDF of two pages, like the CV',
            { tag: '@regression' },
            async ({ resumePage }) => {
                await resumePage.open();
                const pdf = await resumePage.printToPdf();
                expect(countPdfPages(pdf)).toBe(ResumeCounts.PRINT_PAGES);
            }
        );
    });
});

test.describe('Resume page on a phone', () => {
    test.use({
        viewport: { width: PhoneViewport.WIDTH, height: PhoneViewport.HEIGHT },
        colorScheme: ColorSchemes.LIGHT,
    });

    test(
        'should not overflow sideways and keep the job dates inside the screen',
        { tag: '@regression' },
        async ({ resumePage, page }) => {
            await resumePage.open();
            expect(await horizontalOverflow(page)).toBeLessThanOrEqual(
                LayoutLimits.MAX_HORIZONTAL_OVERFLOW
            );
            await resumePage.dateLinesStayOnScreenAndVerify();
        }
    );
});
