/**
 * Constants for the self-hosted font specs (Figtree, SIL OFL 1.1).
 * Every value was read from the live site or from assets/site.css.
 */

/** Font files and the licence, as paths on the site */
export enum FontFiles {
    NORMAL = '/assets/fonts/figtree-latin-wght-normal.woff2',
    ITALIC = '/assets/fonts/figtree-latin-wght-italic.woff2',
    LICENSE = '/assets/fonts/Figtree-OFL.txt',
    STYLESHEET = '/assets/site.css',
}

/** How the browser reports the loaded font faces: `family|style|weight` */
export enum LoadedFaces {
    REGULAR = 'Figtree|normal|300 900',
    ITALIC = 'Figtree|italic|300 900',
}

/** Text and names used when checking the font */
export enum FontText {
    FAMILY_PREFIX = 'Figtree',
    PROBE_SENTENCE = 'Paulo Pacheco, QA Engineer',
    PROBE_FIGTREE = '700 40px Figtree',
    PROBE_FALLBACK = '700 40px Arial',
    PROBE_MISSING = '700 40px NoSuchFontXYZ',
    LICENSE_TITLE = 'SIL OPEN FONT LICENSE',
    LICENSE_AUTHORS = 'Figtree Project Authors',
    WOFF2_MIME = 'font/woff2',
    PRELOAD_PATTERN = 'figtree-latin-wght-normal\\.woff2$',
}

/** Limits for the font checks */
export const FontRules = {
    HEADING_MIN_WEIGHT: 700,
    BODY_MAX_WEIGHT: 500,
    MAX_FONT_BYTES: 40000,
    MIN_REQUESTS: 3,
    /** Decimal places used when comparing text widths */
    WIDTH_PRECISION: 0,
} as const;
