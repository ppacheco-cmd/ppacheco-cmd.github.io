/**
 * Constants for the web resume page (English): facts, links, counts and
 * print settings. Every value was read from the live page or from the CV.
 */

/** `data-testid` of the page body, used for page-wide colour checks */
export enum PageTestIds {
    PAGE = 'page',
}

/** The three jobs, as shown on the page */
export enum ResumeJobs {
    EURONEXT = 'Euronext',
    EURONEXT_VIA = '(via Quanteam)',
    EURONEXT_DATES = 'Jul 2026 - Present',
    OLD_CURRENT_LABEL = 'Current',
    PROMPTLY = 'Promptly Health',
    QA_ROLE = 'QA Engineer',
    QA_DATES = 'Nov 2024 - Jun 2026',
    QA_DURATION = '1 yr 8 mos',
    BACKEND_ROLE = 'Software Engineer - Backend',
    BACKEND_DATES = 'May 2021 - Nov 2024',
    BACKEND_DURATION = '3 yrs 7 mos',
}

/** Key facts of the CV that must be on the page */
export enum ResumeFacts {
    SUMMARY = '2 years in QA and 3+ years of prior backend engineering',
    E2E_SUITE = 'automated E2E regression suite covering critical user flows, run nightly',
    AGENTS = 'multi-agent system to automate QA workflows',
    ANDROID = 'Built a standalone Android app in Java',
    LANGUAGES = 'Portuguese (Native), English - B2',
    CERTIFICATION = 'ISTQB',
}

/** Contact and download links */
export enum ResumeLinks {
    EMAIL_ADDRESS = 'pauloalexandre19333@gmail.com',
    MAILTO_PREFIX = 'mailto:',
    LINKEDIN_NAME = 'LinkedIn',
    LINKEDIN_PATH = 'linkedin.com/in/palexpacheco',
    GITHUB_NAME = 'GitHub',
    GITHUB_PATH = 'github.com/ppacheco-cmd',
    PDF_NAME = 'Download PDF',
    PDF_HREF = 'cv/PauloPacheco_CV.pdf',
    PDF_FILE = 'PauloPacheco_CV.pdf',
    NEW_TAB = '_blank',
    SAFE_REL = 'noopener',
    CURRENT_PAGE = 'page',
}

/** Words that must never appear in the page's structured data */
export enum StructuredDataRules {
    TYPE = 'Person',
    JOB_TITLE = 'QA Engineer',
    FORBIDDEN_FIELDS = 'telephone|email',
}

/** Counts that describe the page */
export enum ResumeCounts {
    JOBS = 3,
    TIME_ELEMENTS = 9,
    MIN_EXTERNAL_LINKS = 5,
    PRINT_PAGES = 2,
}

/** Print and PDF settings */
export enum PrintSettings {
    FORMAT = 'A4',
    MARGIN = '14mm',
}

/** Colours the browser reports in print: black text, white paper */
export enum PrintColors {
    INK = 'rgb(0, 0, 0)',
}
