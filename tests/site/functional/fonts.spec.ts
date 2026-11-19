import { expect, test } from '../../../fixtures/pom/test-options';
import { computedStyle } from '../../../helpers/site/browser';
import {
    charactersOutsideRanges,
    collectRequestUrls,
    fontUnicodeRanges,
    loadedFonts,
    preloadedFonts,
    probeTextWidths,
} from '../../../helpers/site/fonts';
import { ColorSchemes } from '../../../enums/site/help';
import { Questions } from '../../../enums/site/ask';
import {
    FontFiles,
    FontRules,
    FontText,
    LoadedFaces,
} from '../../../enums/site/fonts';
import type { HomePage } from '../../../pages/site/home.page';
import type { ResumePage } from '../../../pages/site/resume.page';

/** Both pages use the same font; each page object exposes `open()` and `documentBody` */
const PAGES = [
    { name: 'home page', pick: 'homePage' },
    { name: 'resume page', pick: 'resumePage' },
] as const;

type Pages = { homePage: HomePage; resumePage: ResumePage };

const PAGE_OF: Record<
    (typeof PAGES)[number]['pick'],
    (pages: Pages) => HomePage | ResumePage
> = {
    homePage: (pages) => pages.homePage,
    resumePage: (pages) => pages.resumePage,
};

test.describe('Self-hosted font', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    for (const { name, pick } of PAGES) {
        test(
            `should load and use the regular Figtree file on the ${name}`,
            { tag: '@smoke' },
            async ({ homePage, resumePage, page }) => {
                const subject = PAGE_OF[pick]({ homePage, resumePage });
                await subject.open();
                expect(await loadedFonts(page)).toContain(LoadedFaces.REGULAR);
                const family = await computedStyle(
                    subject.documentBody,
                    'font-family'
                );
                expect(family.startsWith(FontText.FAMILY_PREFIX)).toBe(true);
            }
        );

        test(
            `should keep every request on this site on the ${name} (no Google Fonts or other third parties)`,
            { tag: '@regression' },
            async ({ homePage, resumePage, page, baseURL }) => {
                const urls = collectRequestUrls(page);
                await PAGE_OF[pick]({ homePage, resumePage }).open();
                await loadedFonts(page);
                expect(urls.length).toBeGreaterThan(FontRules.MIN_REQUESTS);
                for (const url of urls) {
                    expect(url.startsWith(baseURL ?? '')).toBe(true);
                }
            }
        );
    }

    test(
        'should load the italic file on the resume page, where italics are used',
        { tag: '@regression' },
        async ({ resumePage, page }) => {
            await resumePage.open();
            expect(await loadedFonts(page)).toContain(LoadedFaces.ITALIC);
        }
    );

    test(
        'should render text in Figtree, not in a fallback font',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await homePage.open();
            const widths = await probeTextWidths(
                page,
                FontText.PROBE_SENTENCE,
                {
                    figtree: FontText.PROBE_FIGTREE,
                    fallback: FontText.PROBE_FALLBACK,
                    missing: FontText.PROBE_MISSING,
                }
            );
            expect(widths.figtree).not.toBeCloseTo(
                widths.fallback,
                FontRules.WIDTH_PRECISION
            );
            expect(widths.figtree).not.toBeCloseTo(
                widths.missing,
                FontRules.WIDTH_PRECISION
            );
        }
    );

    test(
        'should use different weights of the same family for the heading and the body',
        { tag: '@regression' },
        async ({ homePage }) => {
            await homePage.open();
            const heading = await computedStyle(
                homePage.heading,
                'font-weight'
            );
            const body = await computedStyle(
                homePage.documentBody,
                'font-weight'
            );
            expect(Number(heading)).toBeGreaterThanOrEqual(
                FontRules.HEADING_MIN_WEIGHT
            );
            expect(Number(body)).toBeLessThanOrEqual(FontRules.BODY_MAX_WEIGHT);
        }
    );

    test(
        'should serve the font files as small woff2',
        { tag: '@regression' },
        async ({ request }) => {
            for (const file of [FontFiles.NORMAL, FontFiles.ITALIC]) {
                const response = await request.get(file);
                expect(response.status()).toBe(200);
                expect(response.headers()['content-type']).toContain(
                    FontText.WOFF2_MIME
                );
                expect((await response.body()).length).toBeLessThan(
                    FontRules.MAX_FONT_BYTES
                );
            }
        }
    );

    test(
        'should ship the font licence with the font',
        { tag: '@regression' },
        async ({ request }) => {
            const response = await request.get(FontFiles.LICENSE);
            expect(response.status()).toBe(200);
            const text = await response.text();
            expect(text).toContain(FontText.LICENSE_TITLE);
            expect(text).toContain(FontText.LICENSE_AUTHORS);
        }
    );

    test(
        'should preload the font on the home page so text does not flash in another face',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await homePage.open();
            const [preload] = await preloadedFonts(page);
            expect(preload?.href).toMatch(new RegExp(FontText.PRELOAD_PATTERN));
            expect(preload?.crossorigin).toBe('');
        }
    );
});

/**
 * Guard: all visible text can be set in Figtree. The font is a latin subset. If
 * new text ever uses a character outside the declared unicode-range (an arrow
 * or an emoji, say), the browser would silently use another font for it, so
 * these tests fail first.
 */
test.describe('Guard: all visible text is inside the Figtree range', () => {
    test(
        'should use only supported characters on the home page',
        { tag: '@regression' },
        async ({ homePage, request }) => {
            const css = await (await request.get(FontFiles.STYLESHEET)).text();
            await homePage.open();
            const text = await homePage.bodyText();
            expect(
                charactersOutsideRanges(text, fontUnicodeRanges(css))
            ).toEqual([]);
        }
    );

    test(
        'should use only supported characters on the resume page',
        { tag: '@regression' },
        async ({ resumePage, request }) => {
            const css = await (await request.get(FontFiles.STYLESHEET)).text();
            await resumePage.open();
            const text = await resumePage.bodyText();
            expect(
                charactersOutsideRanges(text, fontUnicodeRanges(css))
            ).toEqual([]);
        }
    );

    for (const question of Object.values(Questions)) {
        test(
            `should use only supported characters in the answer to "${question}"`,
            { tag: '@regression' },
            async ({ homePage, request }) => {
                const css = await (
                    await request.get(FontFiles.STYLESHEET)
                ).text();
                await homePage.open();
                await homePage.askQuestionAndVerify(question);
                const text = await homePage.answerText();
                expect(
                    charactersOutsideRanges(text, fontUnicodeRanges(css))
                ).toEqual([]);
            }
        );
    }
});
