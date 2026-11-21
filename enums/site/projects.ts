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

/** Test ids of the "How the tests run" block */
export enum PipelineTestIds {
    TITLE = 'pipelines-title',
    LIST = 'pipelines',
}

/** Visible text of the "How the tests run" block (English), in page order */
export enum PipelineText {
    TITLE = 'How the tests run',
    INTRO = 'Three pipelines on GitHub Actions, each with its own job.',
    COMMIT_NAME = 'Every commit',
    COMMIT_DESCRIPTION = 'Fast feedback: ESLint, Prettier, TypeScript and a rule scan, then the smoke tests and the translation-data checks.',
    MAIN_NAME = 'Every merge to main',
    MAIN_DESCRIPTION = 'The full suite (smoke, data and regression tests) and a Lighthouse quality gate on four pages, in mobile and desktop mode.',
    NIGHT_NAME = 'Every night',
    NIGHT_DESCRIPTION = 'The full suite and a Lighthouse run against the live site, and the smoke tests in Firefox and WebKit.',
}

/** The three pipeline names, in page order, for each other language (independent anchors) */
export const PipelineAnchors = {
    pt: {
        title: 'Como os testes correm',
        names: ['A cada commit', 'A cada merge para a main', 'Todas as noites'],
    },
    es: {
        title: 'Cómo se ejecutan las pruebas',
        names: ['En cada commit', 'En cada merge a main', 'Cada noche'],
    },
    fr: {
        title: "Comment les tests s'exécutent",
        names: ['À chaque commit', 'À chaque merge sur main', 'Chaque nuit'],
    },
} as const;

/** Workflow files that implement the three pipelines */
export enum WorkflowFiles {
    COMMIT = '.github/workflows/commit.yml',
    MAIN = '.github/workflows/merge-to-main.yml',
    NIGHTLY = '.github/workflows/nightly.yml',
}

/** What each pipeline must contain, so the page cannot claim more than runs */
export const PipelineFacts = {
    commit: {
        trigger: 'branches-ignore: [main]',
        steps: [
            'npm run lint',
            'prettier --check',
            'tsc --noEmit',
            'enforce_constitution.py --scan',
            'npm run test:smoke',
            'npm run test:sanity',
        ],
    },
    main: {
        trigger: 'branches: [main]',
        steps: ['npm run test:ci', 'npm run lighthouse'],
    },
    nightly: {
        schedule: 'cron:',
        steps: [
            'ENVIRONMENT: live',
            'LH_BASE:',
            'browser: [firefox, webkit]',
            '--grep @smoke',
        ],
    },
} as const;

/** Numbers the page states in words, and the words */
export enum PipelineNumbers {
    LIGHTHOUSE_PAGES = 4,
}
