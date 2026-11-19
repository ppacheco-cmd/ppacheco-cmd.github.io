/**
 * Constants for the theme, motion, layout and CV-file specs of the home page.
 * Every value was read from the live page or from assets/site.css.
 */

/** `content` of the `theme-color` meta tag (the browser address-bar colour) */
export enum ThemeMeta {
    LIGHT = '#ffffff',
    DARK = '#0f1115',
}

/** Where the visitor's theme choice is saved (localStorage key) */
export enum ThemeStorage {
    KEY = 'theme',
}

/** Motion preferences a browser can report */
export enum MotionPreferences {
    NO_PREFERENCE = 'no-preference',
    REDUCE = 'reduce',
}

/** CSS values several specs compare against */
export const CssValues = {
    NONE: 'none',
    OPAQUE: '1',
    STICKY: 'sticky',
} as const;

/** Test ids of the decorative icons */
export enum IconTestIds {
    MOON = 'icon-moon',
    SUN = 'icon-sun',
    LINKEDIN = 'icon-linkedin',
    EMAIL = 'icon-email',
}

/** Top bar and page layout limits, in CSS pixels */
export const TopBarLayout = {
    DESKTOP_WIDTHS: [1280, 1920],
    DESKTOP_HEIGHT: 800,
    EDGE_MIN: 16,
    EDGE_MAX: 32,
    TOGGLE_ICON_HALF: 10,
    WIDE_WIDTH: 1920,
    WIDE_HEIGHT: 900,
    COLUMN_MIN_OFFSET: 200,
} as const;

/** Layout rules of the phone view */
export const PhoneLayout = {
    CONTENT_GUTTER: 24,
    BORDER_SLACK: 2,
    ROUNDING_SLACK: 1,
} as const;

/** The small icons beside LinkedIn and Email */
export const ContactIcons = {
    SIZE: 18,
    MAX_CENTRE_OFFSET: 4,
    MIN_TAP_HEIGHT: 24,
} as const;

/** Rules for the downloadable CV file */
export const CvFileRules = {
    FOLDER: 'cv',
    FILE_NAME: 'PauloPacheco_CV.pdf',
    EXTENSION: '.pdf',
    MIME: 'application/pdf',
    MAGIC: '%PDF-',
    MIN_BYTES: 10000,
} as const;

/** Link names and file names used by the content specs */
export enum ContentLinks {
    CV_NAME = 'Download CV',
    GITHUB_NAME = 'GitHub',
    LINKEDIN_NAME = 'LinkedIn',
    EMAIL_NAME = 'Email',
    GITHUB_PATH = 'github.com/ppacheco-cmd',
    LINKEDIN_PATH = 'linkedin.com/in/palexpacheco',
    MAILTO_PATTERN = '^mailto:.+@.+',
    NEW_TAB = '_blank',
    SAFE_REL = 'noopener',
    CV_FILE = 'PauloPacheco_CV.pdf',
}

/** Text of the top bar badge */
export enum BrandText {
    BADGE = 'PP',
}
