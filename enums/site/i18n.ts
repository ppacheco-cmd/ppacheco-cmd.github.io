/**
 * Constants for the language specs (English, Portuguese, Spanish, French).
 *
 * The anchor strings below are written independently of assets/i18n.js on
 * purpose: if a translation is corrupted or edited by accident, the page no
 * longer matches the anchor and the spec fails. French uses a no-break space
 * (U+00A0) before : ; ? and !
 */

/** Languages the site offers, in switcher order */
export const ALL_LANGUAGES = ['en', 'pt', 'es', 'fr'] as const;

/** Languages other than English */
export const OTHER_LANGUAGES = ['pt', 'es', 'fr'] as const;

export type LanguageCode = (typeof ALL_LANGUAGES)[number];
export type OtherLanguageCode = (typeof OTHER_LANGUAGES)[number];

const NBSP = ' ';

/** Independent anchor strings per language */
export const Anchors = {
    pt: {
        tag: 'pt-PT',
        short: 'PT',
        langLabel: 'Idioma',
        navResume: 'Currículo',
        navAsk: 'Perguntas',
        cvIdle: 'Descarregar CV (PDF, em inglês)',
        cvIdleResume: 'Descarregar PDF (em inglês)',
        cvDone: 'Download iniciado',
        status: 'Download iniciado: PauloPacheco_CV.pdf',
        askTitle: 'Pergunte sobre o meu percurso',
        firstQuestion: 'Numa frase, quem é?',
        help: 'O que faz um QA Engineer?',
        toDark: 'Mudar para o modo escuro',
        toLight: 'Mudar para o modo claro',
        title: 'Paulo Pacheco',
        resumeTitle: 'Currículo - Paulo Pacheco',
        experienceHeading: 'Experiência profissional',
        languagesHeading: 'Idiomas e certificações',
        current: 'Atual',
        qaDates: 'nov. 2024 - jun. 2026',
        qaDuration: '1 ano e 8 meses',
        tools: 'Ferramentas',
        more: 'Ver o currículo completo',
        mobileStart: 'Não testei aplicações móveis a nível profissional',
        mentalHealth: 'saúde mental',
        summaryHeading: 'Resumo',
    },
    es: {
        tag: 'es',
        short: 'ES',
        langLabel: 'Idioma',
        navResume: 'Currículum',
        navAsk: 'Preguntas',
        cvIdle: 'Descargar CV (PDF, en inglés)',
        cvIdleResume: 'Descargar PDF (en inglés)',
        cvDone: 'Descarga iniciada',
        status: 'Descarga iniciada: PauloPacheco_CV.pdf',
        askTitle: 'Pregunta sobre mi trayectoria',
        firstQuestion: 'En una frase, ¿quién eres?',
        help: '¿Qué hace un QA Engineer?',
        toDark: 'Cambiar a modo oscuro',
        toLight: 'Cambiar a modo claro',
        title: 'Paulo Pacheco',
        resumeTitle: 'Currículum - Paulo Pacheco',
        experienceHeading: 'Experiencia profesional',
        languagesHeading: 'Idiomas y certificaciones',
        current: 'Actualidad',
        qaDates: 'nov. 2024 - jun. 2026',
        qaDuration: '1 año y 8 meses',
        tools: 'Herramientas',
        more: 'Ver el currículum completo',
        mobileStart: 'No he probado aplicaciones móviles de forma profesional',
        mentalHealth: 'salud mental',
        summaryHeading: 'Resumen',
    },
    fr: {
        tag: 'fr',
        short: 'FR',
        langLabel: 'Langue',
        navResume: 'CV',
        navAsk: 'Questions',
        cvIdle: 'Télécharger le CV (PDF, en anglais)',
        cvIdleResume: 'Télécharger le PDF (en anglais)',
        cvDone: 'Téléchargement lancé',
        status: `Téléchargement lancé${NBSP}: PauloPacheco_CV.pdf`,
        askTitle: 'Posez des questions sur mon parcours',
        firstQuestion: `En une phrase, qui êtes-vous${NBSP}?`,
        help: `Que fait un QA Engineer${NBSP}?`,
        toDark: 'Passer en mode sombre',
        toLight: 'Passer en mode clair',
        title: 'Paulo Pacheco',
        resumeTitle: 'CV - Paulo Pacheco',
        experienceHeading: 'Expérience professionnelle',
        languagesHeading: 'Langues et certifications',
        current: 'Présent',
        qaDates: 'nov. 2024 - juin 2026',
        qaDuration: '1 an et 8 mois',
        tools: 'Outils',
        more: 'Voir le CV complet',
        mobileStart:
            "Je n'ai pas testé d'applications mobiles de façon professionnelle",
        mentalHealth: 'santé mentale',
        summaryHeading: 'Profil',
    },
} as const;

/** English anchors for the same strings, where the specs need them */
export const EnglishAnchors = {
    tag: 'en-US',
    short: 'EN',
    langLabel: 'Language',
    askTitle: 'Ask about my background',
    firstQuestion: 'In one line, who are you?',
    automationQuestion: 'Do you have test automation experience?',
    summaryHeading: 'Summary',
    mentalHealth: 'mental health',
} as const;

/** Switcher contents */
export const SwitcherOptions = {
    labels: ['English', 'Português', 'Español', 'Français'],
    langAttributes: ['en-US', 'pt-PT', 'es', 'fr'],
    values: ['en', 'pt', 'es', 'fr'],
} as const;

/** Document `lang` value for each language code */
export const DocumentLang: Record<LanguageCode, string> = {
    en: 'en-US',
    pt: 'pt-PT',
    es: 'es',
    fr: 'fr',
};

/** Browser locale -> site language and document `lang` */
export const BrowserLocaleCases = [
    { locale: 'pt-PT', code: 'pt', tag: 'pt-PT' },
    { locale: 'pt-BR', code: 'pt', tag: 'pt-PT' },
    { locale: 'es-ES', code: 'es', tag: 'es' },
    { locale: 'es-MX', code: 'es', tag: 'es' },
    { locale: 'fr-FR', code: 'fr', tag: 'fr' },
    { locale: 'fr-CA', code: 'fr', tag: 'fr' },
    { locale: 'en-GB', code: 'en', tag: 'en-US' },
    { locale: 'de-DE', code: 'en', tag: 'en-US' },
    { locale: 'ja-JP', code: 'en', tag: 'en-US' },
] as const;

/** Values of the `?lang=` address parameter */
export const LangParameters = {
    PORTUGUESE: 'pt',
    FRENCH: 'fr',
    SPANISH: 'es',
    MIXED_CASE_REGION: 'PT-pt',
    UNKNOWN: 'xx',
    SCRIPT_INJECTION: '<script>alert(1)</script>',
} as const;

/** Browser preference list where the first supported language is Spanish */
export const PreferenceList = {
    LOCALE: 'de-DE',
    LANGUAGES: ['de-DE', 'ja-JP', 'es-AR', 'fr-FR'],
    EXPECTED: 'es',
} as const;

/** Storage and attribute names used by the language feature */
export enum LanguageStorage {
    KEY = 'lang',
    DATA_ATTRIBUTE = 'data-lang',
    PENDING_ATTRIBUTE = 'data-pending-lang',
}

/** Test ids added for the language specs */
export enum I18nTestIds {
    BRAND = 'brand',
    THEME_TOGGLE = 'theme-toggle',
    SWITCHER = 'lang-switcher',
    CODE = 'lang-code',
    CHIPS = 'chips',
    HINT = 'answer-hint',
    SUMMARY = 'summary',
    JOB_EDUCATION = 'job-education',
    JOB_EURONEXT = 'job-euronext',
    JOB_PROMPTLY_QA = 'job-promptly-qa',
    JOB_PROMPTLY_BACKEND = 'job-promptly-backend',
    PROJECT = 'project-kiosk',
    JOB_DATES = 'job-dates',
    JOB_DURATION = 'job-duration',
    JOB_TOOLS = 'job-tools',
    JOB_TOOLS_LABEL = 'job-tools-label',
    PUBLICATION = 'publication',
    LANGUAGES = 'languages',
}

/** Resume bullets per section: Euronext, Promptly QA, Promptly backend, project */
export const BulletCounts = {
    'r.eu': 3,
    'r.pq': 6,
    'r.pb': 5,
    'r.pr': 3,
} as const;

/** Expected machine-readable months of every date, in page order */
export const IsoMonthsInOrder = [
    '2015-09',
    '2021-03',
    '2026-07',
    '2024-11',
    '2026-06',
    '2021-05',
    '2024-11',
    '2019-10',
    '2021-03',
] as const;

/** The English wording that must stay on the page in every language */
export enum Unchanged {
    EURONEXT = 'Euronext',
    ISTQB_LINK = 'ISTQB® Certified Tester Foundation Level 4.0',
    PROMPTLY_QA_TOOLS = 'GitHub, GitHub Actions, Agile, Jira, Playwright, Python, Postman, Sentry, Grafana, Claude Code',
    PUBLICATION_TITLE = 'Designing Effective User Interface Experiences',
    ANDROID_STUDIO = 'Android Studio',
    UNVERIFIED_COVERAGE = '60%',
    REMOVED_DELIVERY_GAIN = '15%',
    PROJECT_RESULT = '~16%',
    LANGUAGE_LEVEL = 'B2',
    MAILTO = '^mailto:',
}

/** How many ready-made questions and help bullets there are */
export enum I18nCounts {
    QUESTIONS = 9,
    HELP_BULLETS = 4,
    MIN_PAGE_KEYS = 60,
    MIN_RAW_KEYS = 15,
}

/** Small-phone widths for the top-bar fit checks */
export const SmallPhoneWidths = [360, 390] as const;

/** Height used for the small-phone checks */
export enum SmallPhoneHeight {
    HEIGHT = 800,
}

/** Tolerances for the top-bar fit checks, in CSS pixels */
export const FitTolerance = {
    RIGHT_EDGE: 0.5,
    OVERLAP: 1,
    SWITCHER_TO_TOGGLE: 12,
    MIN_SWITCHER_HEIGHT: 24,
} as const;

/** Print result of the translated resume */
export enum TranslatedPrint {
    PAGES = 2,
}

/** Index of the question the mobile answer belongs to, and the automation one (zero-based) */
export enum QuestionIndex {
    SECOND = 1,
    AUTOMATION = 2,
    MOBILE = 6,
}

/** Product and tool names that must survive translation */
export const ProductNames = [
    'Playwright',
    'GitHub Actions',
    'Sentry',
    'Grafana',
    'Jira',
    'Pytest',
    'Django',
    'Android Studio',
    'XRay',
    'Gherkin',
    'CHUSJ',
    'Euronext',
    'Promptly Health',
    'ISTQB',
] as const;

/** Keys that may legitimately equal the English text (names kept in English) */
export const SameAsEnglish = {
    all: ['c.role', 'r.role.be', 'i.title', 'r.sk.v2'],
    fr: ['r.via', 'r.h.publications'],
} as const;
