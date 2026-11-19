/**
 * Constants for the "?" help next to "QA Engineer" and for values shared by
 * several specs (test ids, geometry limits, theme colours, phone viewport).
 * Every value was read from the live page (playwright-cli) or from assets/site.css.
 */

/** `data-testid` values the specs rely on */
export enum TestIds {
    QA_HELP = 'qa-help',
    ANSWER = 'answer',
    ROLE = 'role',
}

/** Text of the help button and of its summary of the QA role (English) */
export enum HelpText {
    BUTTON = 'What does a QA engineer do?',
    BUTTON_MARK = '?',
    INTRO = 'quality assurance',
    ITEM_CRITERIA = 'acceptance criteria and test cases',
    ITEM_AUTOMATION = 'test by hand and with automation',
    ITEM_BUGS = 'bugs',
    ITEM_TEAM = 'developers, designers and product owners',
}

/** How many bullet points the help summary has */
export enum HelpCounts {
    ITEMS = 4,
}

/** Layout limits, in CSS pixels (a const object: two limits share the value 24) */
export const HelpGeometry = {
    /** Largest gap between "QA Engineer" and the "?" button */
    MAX_GAP: 24,
    /** Largest vertical offset between the centres of the text and the button */
    MAX_VERTICAL_OFFSET: 6,
    /** Smallest comfortable tap target */
    MIN_TAP_SIZE: 24,
} as const;

/** Phone viewport used by the "phone width" specs */
export enum PhoneViewport {
    WIDTH = 390,
    HEIGHT = 844,
}

/** Largest horizontal overflow tolerated on a phone */
export enum LayoutLimits {
    MAX_HORIZONTAL_OVERFLOW = 0,
}

/** Colours computed from assets/site.css, as the browser reports them */
export enum ThemeColors {
    ACCENT_LIGHT = 'rgb(59, 91, 134)',
    ACCENT_DARK = 'rgb(126, 160, 209)',
    PAGE_BG_LIGHT = 'rgb(255, 255, 255)',
    INK_LIGHT = 'rgb(17, 17, 17)',
    PAGE_BG_DARK = 'rgb(15, 17, 21)',
    INK_DARK = 'rgb(242, 242, 242)',
}

/** Color schemes the browser can emulate */
export enum ColorSchemes {
    LIGHT = 'light',
    DARK = 'dark',
}
