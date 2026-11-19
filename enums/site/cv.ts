/**
 * Constants for the CV download button specs (home and resume pages).
 * Every value was read from the live pages or from assets/site.css and assets/site.js.
 */

/** `data-testid` values of the CV button and its two icons */
export enum CvTestIds {
    BUTTON = 'cv-button',
    ICON_IDLE = 'cv-icon-idle',
    ICON_DONE = 'cv-icon-done',
}

/** Names, labels and attribute values of the button */
export enum CvButtonText {
    HOME_IDLE = 'Download CV (PDF)',
    RESUME_IDLE = 'Download PDF',
    DONE = 'Download started',
    FILE = 'PauloPacheco_CV.pdf',
    HREF = 'cv/PauloPacheco_CV.pdf',
    STATUS_MESSAGE = 'Download started: PauloPacheco_CV.pdf',
    LIVE_REGION = 'polite',
    STATE_ATTRIBUTE = 'data-state',
    STATE_IDLE = 'idle',
    STATE_DONE = 'done',
}

/** Colours of the button, as the browser reports them */
export enum CvColors {
    SUCCESS_LIGHT = 'rgb(31, 122, 77)',
    SUCCESS_DARK = 'rgb(127, 209, 163)',
    SUCCESS_DARK_INK = 'rgb(15, 17, 21)',
    IDLE_ACCENT = 'rgb(59, 91, 134)',
}

/** Names of the check-mark animation */
export enum CvAnimations {
    POP = 'confirm-pop',
    NONE = 'none',
}

/** Durations from assets/site.js, in milliseconds */
export const CvTimings = {
    /** How long "Download started" stays after a click */
    CONFIRMATION: 3500,
    /** Time between the first click and the second one in the restart test */
    BEFORE_SECOND_CLICK: 2000,
    /** Time after the second click at which the confirmation must still be shown */
    AFTER_SECOND_CLICK: 2000,
    /** Time still left after that until the restarted confirmation ends */
    REMAINING: 1600,
} as const;

/** Tolerances for the "nothing jumps" checks, in CSS pixels */
export const CvTolerances = {
    SIZE: 0.5,
    POSITION_PRECISION: 0,
} as const;

/** How many browser tabs a click is allowed to leave open */
export enum TabCounts {
    ONE = 1,
}

/** Number of CV buttons on a page */
export enum CvButtonCounts {
    PER_PAGE = 1,
}

/** How the save-only mechanism marks and shapes the download */
export enum SaveOnly {
    READY_ATTRIBUTE = 'data-ready',
    READY = 'true',
    BLOB_PREFIX = 'blob:',
    GENERIC_BINARY = 'application/octet-stream',
    PDF_SUFFIX = '.pdf',
}

/** What a click handler may do with each kind of click: true means it takes the click over */
export const ClickHandling = {
    normal: true,
    ctrl: false,
    meta: false,
    shift: false,
    alt: false,
} as const;
