/**
 * Constants for the home page "Projects" section (English).
 * Every value was read from the live page (playwright-cli).
 */

/** `data-testid` values of the section */
export enum ProjectTestIds {
    SECTION = 'projects',
    CARD = 'project-card',
}

/** Visible text of the section and its card */
export enum ProjectsText {
    TITLE = 'Projects',
    SUBTITLE = 'Things I build and test on my own.',
    NAME = 'This website and its test suite',
    DESCRIPTION = 'A personal site in four languages, built with plain HTML, CSS and JavaScript, with no framework or build step. It is tested with Playwright and TypeScript (page objects), axe-core accessibility scans and a Lighthouse quality gate.',
    TAGS_LABEL = 'Technologies used',
    LINK = 'View the code on GitHub',
}

/** The technology tags, in page order (names are not translated) */
export const ProjectTags = [
    'Playwright',
    'TypeScript',
    'axe-core',
    'Lighthouse',
    'GitHub Actions',
    'HTML, CSS, JavaScript',
] as const;

/** Where the project link must point, and how it must open */
export enum ProjectLinkRules {
    REPOSITORY_PATH = 'github.com/ppacheco-cmd/ppacheco-cmd.github.io',
    NEW_TAB = '_blank',
    SAFE_REL = 'noopener',
}

/**
 * Independent anchors for the translated section, written separately from
 * assets/i18n.js so a wrong or missing translation is noticed.
 */
export const ProjectAnchors = {
    pt: { title: 'Projetos', link: 'Ver o código no GitHub' },
    es: { title: 'Proyectos', link: 'Ver el código en GitHub' },
    fr: { title: 'Projets', link: 'Voir le code sur GitHub' },
} as const;
