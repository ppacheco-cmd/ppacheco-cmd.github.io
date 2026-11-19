import { Page } from '@playwright/test';

/** Text widths of one sentence in three fonts, in CSS pixels */
export interface TextWidths {
    figtree: number;
    fallback: number;
    missing: number;
}

/** A preloaded font link as written in the page head */
export interface PreloadedFont {
    href: string | null;
    crossorigin: string | null;
}

/**
 * Lists the font faces the browser has finished loading.
 *
 * @param page - The page to inspect.
 * @returns Entries shaped `family|style|weight`, e.g. `Figtree|normal|300 900`.
 */
export async function loadedFonts(page: Page): Promise<string[]> {
    return page.evaluate(async () => {
        await document.fonts.ready;
        return [...document.fonts]
            .filter((face) => face.status === 'loaded')
            .map(
                (face) =>
                    `${face.family.replace(/"/g, '')}|${face.style}|${face.weight}`
            );
    });
}

/**
 * Measures one sentence in three fonts. If the first width equals the others,
 * the page is not really rendering in the first font.
 *
 * @param page - The page to run in.
 * @param sentence - The sentence to measure.
 * @param fonts - CSS font shorthands for the real font, a fallback and a missing font.
 * @returns The three widths.
 */
export async function probeTextWidths(
    page: Page,
    sentence: string,
    fonts: { figtree: string; fallback: string; missing: string }
): Promise<TextWidths> {
    return page.evaluate(
        async ({ text, font }) => {
            await document.fonts.ready;
            const measure = (css: string): number => {
                const context = document
                    .createElement('canvas')
                    .getContext('2d');
                if (!context) return 0;
                context.font = css;
                return context.measureText(text).width;
            };
            return {
                figtree: measure(font.figtree),
                fallback: measure(font.fallback),
                missing: measure(font.missing),
            };
        },
        { text: sentence, font: fonts }
    );
}

/**
 * Reads the preloaded font links from the page head.
 *
 * @param page - The page to inspect.
 * @returns One entry per `<link rel="preload" as="font">`.
 */
export async function preloadedFonts(page: Page): Promise<PreloadedFont[]> {
    return page.evaluate(() =>
        [...document.querySelectorAll('link[rel="preload"][as="font"]')].map(
            (link) => ({
                href: link.getAttribute('href'),
                crossorigin: link.getAttribute('crossorigin'),
            })
        )
    );
}

/**
 * Collects the URL of every request the page makes (data: URLs excluded).
 *
 * @param page - The page to watch; call before navigating.
 * @returns A live list that fills as requests are made.
 */
export function collectRequestUrls(page: Page): string[] {
    const urls: string[] = [];
    page.on('request', (request) => {
        if (!request.url().startsWith('data:')) urls.push(request.url());
    });
    return urls;
}

/**
 * Reads the Unicode ranges the site's font is declared for.
 *
 * @param css - The stylesheet text.
 * @returns A list of [first, last] code points.
 */
export function fontUnicodeRanges(css: string): Array<[number, number]> {
    const declaration = /unicode-range:\s*([^;]+);/.exec(css);
    if (!declaration) return [];
    return declaration[1].split(',').map((part) => {
        const [first, last] = part
            .trim()
            .replace('U+', '')
            .split('-')
            .map((hex) => parseInt(hex, 16));
        return [first, last ?? first];
    });
}

/**
 * Finds characters a text uses that the font is not declared for.
 *
 * @param text - The visible text to check.
 * @param ranges - The ranges from {@link fontUnicodeRanges}.
 * @returns The distinct characters outside every range (whitespace is ignored).
 */
export function charactersOutsideRanges(
    text: string,
    ranges: Array<[number, number]>
): string[] {
    const outside = new Set<string>();
    for (const character of text) {
        const code = character.codePointAt(0) ?? 0;
        const inside = ranges.some(
            ([first, last]) => code >= first && code <= last
        );
        if (!/\s/.test(character) && !inside) outside.add(character);
    }
    return [...outside];
}
