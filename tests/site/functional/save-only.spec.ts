import type { Download } from '@playwright/test';
import { expect, test } from '../../../fixtures/pom/test-options';
import {
    blobTypes,
    clickHandlingByModifier,
    embeddedViewerCount,
    holdCvRequests,
    removeDownloadAttribute,
    removeFetch,
    trackBlobTypes,
} from '../../../helpers/site/browser';
import { readDownload, sha256 } from '../../../helpers/site/files';
import { collectRequestUrls } from '../../../helpers/site/fonts';
import { PAGE_OF, PAGES } from '../../../helpers/site/page-lookup';
import { ColorSchemes } from '../../../enums/site/help';
import {
    ClickHandling,
    CvButtonText,
    SaveOnly,
    TabCounts,
} from '../../../enums/site/cv';
import { CvFileRules } from '../../../enums/site/theme';

/** Whether a download came from a generated blob (the save-only path) */
const isBlob = (download: Download): boolean =>
    download.url().startsWith(SaveOnly.BLOB_PREFIX);

for (const { name, pick } of PAGES) {
    test.describe(`Save-only CV button on the ${name}`, () => {
        test.use({ colorScheme: ColorSchemes.LIGHT });

        test(
            'should prepare the file in the background right after the page loads',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                await expect(subject.cvButton.button).toBeVisible();
                await subject.cvButton.readyToSaveAndVerify();
            }
        );

        test(
            'should save the real PDF, byte for byte, from a generic-binary download',
            { tag: '@smoke' },
            async ({ homePage, resumePage, request }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                await subject.cvButton.readyToSaveAndVerify();
                const served = await (
                    await request.get(`/${CvButtonText.HREF}`)
                ).body();
                const download =
                    await subject.cvButton.clickAndWaitForDownload();
                expect(isBlob(download)).toBe(true);
                expect(download.suggestedFilename()).toBe(CvButtonText.FILE);
                const saved = await readDownload(download);
                expect(
                    saved.subarray(0, CvFileRules.MAGIC.length).toString()
                ).toBe(CvFileRules.MAGIC);
                expect(saved).toHaveLength(served.length);
                expect(sha256(saved)).toBe(sha256(served));
            }
        );

        test(
            'should tell the browser the data is generic binary, so it cannot display it',
            { tag: '@regression' },
            async ({ homePage, resumePage, page }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await trackBlobTypes(page);
                await subject.open();
                await subject.cvButton.readyToSaveAndVerify();
                expect(await blobTypes(page)).toEqual([
                    SaveOnly.GENERIC_BINARY,
                ]);
            }
        );

        test(
            'should still save the file with the right name if the browser ignores the download attribute',
            { tag: '@regression' },
            async ({ homePage, resumePage, page, context }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                await subject.cvButton.readyToSaveAndVerify();
                await removeDownloadAttribute(subject.cvButton.button);
                const urlBefore = page.url();
                const download =
                    await subject.cvButton.clickAndWaitForDownload();
                expect(download.suggestedFilename()).toBe(CvButtonText.FILE);
                await expect(subject.cvButton.doneLink).toBeVisible();
                expect(page.url()).toBe(urlBefore);
                expect(context.pages()).toHaveLength(TabCounts.ONE);
            }
        );

        test(
            'should never embed or display the PDF in the page',
            { tag: '@regression' },
            async ({ homePage, resumePage, page }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                await subject.cvButton.readyToSaveAndVerify();
                await subject.cvButton.clickAndWaitForDownload();
                await expect(subject.cvButton.doneLink).toBeVisible();
                expect(await embeddedViewerCount(page)).toBe(0);
                await expect(subject.heading).toBeVisible();
            }
        );

        test(
            'should let the plain link save the file when it is not ready yet',
            { tag: '@regression' },
            async ({ homePage, resumePage, page }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                const release = await holdCvRequests(page);
                await subject.open();
                await subject.cvButton.notReadyToSaveAndVerify();
                const downloadStarted = page.waitForEvent('download');
                await subject.cvButton.click();
                release();
                const download = await downloadStarted;
                expect(download.suggestedFilename()).toBe(CvButtonText.FILE);
                expect(isBlob(download)).toBe(false);
                await expect(subject.cvButton.doneLink).toBeVisible();
            }
        );

        test(
            'should let the plain link save and confirm when fetch is not available',
            { tag: '@regression' },
            async ({ homePage, resumePage, page }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await removeFetch(page);
                await subject.open();
                await subject.cvButton.notReadyToSaveAndVerify();
                const download =
                    await subject.cvButton.clickAndWaitForDownload();
                expect(download.suggestedFilename()).toBe(CvButtonText.FILE);
                await subject.cvButton.confirmationShownAndVerify();
            }
        );

        test(
            'should leave Ctrl, Cmd, Shift and Alt clicks to the browser and take over a normal click',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                await subject.cvButton.readyToSaveAndVerify();
                expect(
                    await clickHandlingByModifier(subject.cvButton.button)
                ).toEqual(ClickHandling);
            }
        );

        test(
            'should save from the keyboard through the generated file',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                await subject.cvButton.readyToSaveAndVerify();
                await subject.cvButton.focus();
                const download =
                    await subject.cvButton.pressEnterAndWaitForDownload();
                expect(isBlob(download)).toBe(true);
                expect(download.suggestedFilename()).toBe(CvButtonText.FILE);
            }
        );

        test(
            'should keep saving the file on repeated clicks',
            { tag: '@regression' },
            async ({ homePage, resumePage }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                await subject.cvButton.readyToSaveAndVerify();
                const first = await subject.cvButton.clickAndWaitForDownload();
                await expect(subject.cvButton.doneLink).toBeVisible();
                const second = await subject.cvButton.clickAndWaitForDownload();
                expect(first.suggestedFilename()).toBe(CvButtonText.FILE);
                expect(second.suggestedFilename()).toBe(CvButtonText.FILE);
            }
        );
    });
}

test.describe('Save-only CV button: requests', () => {
    test(
        'should fetch the CV in the background with a single same-origin request',
        { tag: '@regression' },
        async ({ homePage, page, baseURL }) => {
            const urls = collectRequestUrls(page);
            await homePage.open();
            await homePage.cvButton.readyToSaveAndVerify();
            expect(
                urls.filter((url) => url.endsWith(SaveOnly.PDF_SUFFIX))
            ).toEqual([`${baseURL}/${CvButtonText.HREF}`]);
        }
    );
});
