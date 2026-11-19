/**
 * Constants for the home page "Ask about my background" section and the
 * navigation around it (English). Every value was read from the live page.
 */

/** The ready-made questions, in page order */
export enum Questions {
    WHO = 'In one line, who are you?',
    QA_EXPERIENCE = 'What QA experience do you have?',
    AUTOMATION = 'Do you have test automation experience?',
    AI = 'How do you use AI in your work?',
    HEALTHCARE = 'What is your healthcare background?',
    APIS = 'Have you worked with APIs?',
    MOBILE = 'Do you have mobile experience?',
    BACKEND_TO_QA = 'Why did you move from backend to QA?',
    EDUCATION = 'Education, certification and languages?',
}

/** Visible text, accessible names and attribute values around the questions */
export enum AskUi {
    ASK_HEADING = 'Ask about my background',
    PROMPT_HINT = 'Select a question above',
    MORE_LINK = 'See the full resume',
    MORE_HREF = 'resume.html',
    CV_HREF = 'cv/PauloPacheco_CV.pdf',
    RESUME_LINK = 'Resume',
    ASK_LINK = 'Ask',
    LINKEDIN_LINK = 'LinkedIn',
    EMAIL_LINK = 'Email',
    LIVE_REGION = 'polite',
}

/** Phrases that must appear (or not) in specific answers */
export enum AnswerPhrases {
    AUTOMATION_TOOLS = 'Playwright and GitHub Actions',
    AUTOMATION_SCHEDULE = 'nightly',
    AUTOMATION_TOOL = 'Playwright',
    MOBILE_PLATFORM = 'Android',
    MOBILE_HONESTY = "haven't tested mobile apps professionally",
    MOBILE_TOOL = 'Android Studio',
    API_TOOL = 'Postman',
    HEALTHCARE_EMPLOYER = 'Promptly Health',
    LANGUAGE_LEVEL = 'B2',
    CERTIFICATION = 'ISTQB',
    AI_IMPORT_TOOL = 'XRay',
}

/** Smallest answer length that counts as a real answer, in characters */
export enum AnswerLimits {
    MIN_LENGTH = 120,
}

/** Fraction of an element that must be inside the viewport (1 = all of it) */
export enum ViewportRatio {
    FULL = 1,
}
