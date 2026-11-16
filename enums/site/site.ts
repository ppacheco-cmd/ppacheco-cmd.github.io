/**
 * Site-specific constants: routes and repeated UI strings of the static site
 * under test. Every value was read from the live page (playwright-cli).
 */

/** UI route paths */
export enum SiteRoutes {
    HOME = '/',
    RESUME = '/resume.html',
}

/** Document titles */
export enum PageTitles {
    HOME = 'Paulo Pacheco',
    RESUME = 'Resume - Paulo Pacheco',
}

/** Visible text and accessible names on the home page (English) */
export enum HomeText {
    NAME = 'Paulo Pacheco',
    ROLE = 'QA Engineer',
    CV_LINK = 'Download CV (PDF)',
    QUESTIONS_GROUP = 'Questions about my background',
    ASK_PROMPT = 'Select a question above to see the answer.',
    QUESTION_WHO = 'In one line, who are you?',
}

/** Number of ready-made questions offered on the home page */
export enum HomeCounts {
    QUESTIONS = 9,
}

/** Accessible names of the theme toggle (English) */
export enum ThemeLabels {
    TO_DARK = 'Switch to dark mode',
    TO_LIGHT = 'Switch to light mode',
}

/** Values of the `data-theme` attribute on the root element */
export enum ThemeValues {
    DARK = 'dark',
    LIGHT = 'light',
}

/** Language codes offered by the language switcher */
export enum LanguageCodes {
    EN = 'en',
    PT = 'pt',
    ES = 'es',
    FR = 'fr',
}

/** Resume section headings (English), in CV order */
export enum ResumeSections {
    SUMMARY = 'Summary',
    SKILLS = 'Skills',
    EDUCATION = 'Education',
    EXPERIENCE = 'Professional Experience',
    PROJECTS = 'Projects',
    PUBLICATIONS = 'Publications',
    LANGUAGES = 'Languages & Certifications',
}

/** The Skills section lines, exactly as on the CV */
export enum ResumeSkills {
    TESTING = 'Testing: Test planning, test cases, functional, UAT, E2E regression, defect reporting and investigation',
    TOOLS = 'Tools: Playwright, Python, GitHub Actions, XRay, Postman, Jira, Git',
    SOFT = 'Soft skills: Collaboration, attention to detail, analytical thinking',
}

/** Summary and Skills headings in the other languages */
export enum ResumeHeadingsPt {
    SUMMARY = 'Resumo',
    SKILLS = 'Competências',
}
export enum ResumeHeadingsEs {
    SUMMARY = 'Resumen',
    SKILLS = 'Competencias',
}
export enum ResumeHeadingsFr {
    SUMMARY = 'Profil',
    SKILLS = 'Compétences',
}
