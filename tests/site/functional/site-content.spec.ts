import { expect, test } from '../../../fixtures/pom/test-options';
import { collectPageProblems } from '../../../helpers/site/browser';
import { pdfFilesInCvFolder, readDownload } from '../../../helpers/site/files';
import { ColorSchemes } from '../../../enums/site/help';
import { HomeText, PageTitles } from '../../../enums/site/site';
import {
    BrandText,
    ContentLinks,
    CssValues,
    CvFileRules,
    TopBarLayout,
} from '../../../enums/site/theme';

/** Turns a link path such as `github.com/user` into a pattern that matches inside a URL */
const inUrl = (path: string): RegExp =>
    new RegExp(path.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'));

test.describe('Home page: content and links', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    test.beforeEach(async ({ homePage }) => {
        await homePage.open();
    });

    test(
        'should show the page title, the name and the tagline',
        { tag: '@smoke' },
        async ({ homePage, page }) => {
            await expect(page).toHaveTitle(PageTitles.HOME);
            await expect(homePage.heading).toHaveText(HomeText.NAME);
            await expect(homePage.role).toBeVisible();
        }
    );

    test(
        'should have a sticky top bar with the brand badge and the toggle',
        { tag: '@smoke' },
        async ({ homePage }) => {
            const { topBar } = homePage;
            await expect(topBar.banner).toBeVisible();
            await expect(topBar.banner).toHaveCSS('position', CssValues.STICKY);
            await expect(topBar.brandLink).toHaveText(BrandText.BADGE);
            await expect(topBar.themeToggle).toBeVisible();
        }
    );

    for (const width of TopBarLayout.DESKTOP_WIDTHS) {
        test(
            `should span the screen at ${width}px: badge at the left edge, nav and toggle at the right`,
            { tag: '@regression' },
            async ({ homePage, page }) => {
                await page.setViewportSize({
                    width,
                    height: TopBarLayout.DESKTOP_HEIGHT,
                });
                await expect(homePage.topBar.banner).toBeVisible();
                await homePage.topBar.spansScreenAndVerify(width);
            }
        );
    }

    test(
        'should keep the page content in its own centred column under the full-width bar',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await page.setViewportSize({
                width: TopBarLayout.WIDE_WIDTH,
                height: TopBarLayout.WIDE_HEIGHT,
            });
            await expect(homePage.heading).toBeVisible();
            await homePage.contentSitsInCentredColumnAndVerify();
        }
    );

    test(
        'should have correct Download CV, GitHub, LinkedIn and Email links',
        { tag: '@regression' },
        async ({ homePage }) => {
            await test.step('THEN the CV link points at the PDF and downloads it', async () => {
                await expect(homePage.cvLink).toHaveAttribute(
                    'href',
                    new RegExp(`${CvFileRules.FILE_NAME}$`)
                );
                await expect(homePage.cvLink).toHaveAttribute(
                    'download',
                    ContentLinks.CV_FILE
                );
            });

            await test.step('AND GitHub and LinkedIn open safely in a new tab', async () => {
                await expect(homePage.gitHubLink).toHaveAttribute(
                    'href',
                    inUrl(ContentLinks.GITHUB_PATH)
                );
                await expect(homePage.gitHubLink).toHaveAttribute(
                    'target',
                    ContentLinks.NEW_TAB
                );
                await expect(homePage.gitHubLink).toHaveAttribute(
                    'rel',
                    new RegExp(ContentLinks.SAFE_REL)
                );
                await expect(homePage.linkedInLink).toHaveAttribute(
                    'href',
                    inUrl(ContentLinks.LINKEDIN_PATH)
                );
                await expect(homePage.linkedInLink).toHaveAttribute(
                    'target',
                    ContentLinks.NEW_TAB
                );
                await expect(homePage.linkedInLink).toHaveAttribute(
                    'rel',
                    new RegExp(ContentLinks.SAFE_REL)
                );
            });

            await test.step('AND Email is a mailto link', async () => {
                await expect(homePage.emailLink).toHaveAttribute(
                    'href',
                    new RegExp(ContentLinks.MAILTO_PATTERN)
                );
            });
        }
    );

    test(
        'should download a real PDF with the right file name',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            const downloadPromise = page.waitForEvent('download');
            await homePage.cvLink.click();
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toBe(CvFileRules.FILE_NAME);
            const file = await readDownload(download);
            expect(file.length).toBeGreaterThan(CvFileRules.MIN_BYTES);
            expect(file.subarray(0, CvFileRules.MAGIC.length).toString()).toBe(
                CvFileRules.MAGIC
            );
        }
    );

    test(
        'should serve the CV link target as a PDF',
        { tag: '@regression' },
        async ({ homePage, request }) => {
            const href = await homePage.cvLink.getAttribute('href');
            const response = await request.get(`/${href}`);
            expect(response.status()).toBe(200);
            expect(response.headers()['content-type']).toContain(
                CvFileRules.MIME
            );
        }
    );

    test(
        'should log no console errors and make no failed requests',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            const problems = collectPageProblems(page);
            await homePage.reload();
            await homePage.topBar.clickToggle();
            await homePage.topBar.clickToggle();
            expect(problems).toEqual([]);
        }
    );
});

test.describe('CV folder', () => {
    test(
        'should hold exactly the one PDF the button links to (no stray or old versions)',
        { tag: '@regression' },
        () => {
            expect(pdfFilesInCvFolder()).toEqual([CvFileRules.FILE_NAME]);
        }
    );
});
