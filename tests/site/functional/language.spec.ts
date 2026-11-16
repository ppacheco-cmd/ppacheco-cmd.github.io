import { expect, test } from '../../../fixtures/pom/test-options';
import {
    LanguageCodes,
    ResumeHeadingsEs,
    ResumeHeadingsFr,
    ResumeHeadingsPt,
} from '../../../enums/site/site';

const TRANSLATED_HEADINGS = [
    {
        code: LanguageCodes.PT,
        summary: ResumeHeadingsPt.SUMMARY,
        skills: ResumeHeadingsPt.SKILLS,
    },
    {
        code: LanguageCodes.ES,
        summary: ResumeHeadingsEs.SUMMARY,
        skills: ResumeHeadingsEs.SKILLS,
    },
    {
        code: LanguageCodes.FR,
        summary: ResumeHeadingsFr.SUMMARY,
        skills: ResumeHeadingsFr.SKILLS,
    },
];

test.describe('Language switcher', () => {
    test.use({ locale: 'en-US' });

    test.beforeEach(async ({ resumePage }) => {
        await resumePage.open();
    });

    for (const { code, summary, skills } of TRANSLATED_HEADINGS) {
        test(
            `should translate the resume headings to ${code}`,
            { tag: '@regression' },
            async ({ resumePage }) => {
                await test.step(`WHEN I choose ${code}`, async () => {
                    await resumePage.topBar.selectLanguage(code);
                });

                await test.step('THEN the switcher and the headings follow', async () => {
                    await expect(resumePage.topBar.languageSelect).toHaveValue(
                        code
                    );
                    await expect(
                        resumePage.sectionHeading(summary)
                    ).toBeVisible();
                    await expect(
                        resumePage.sectionHeading(skills)
                    ).toBeVisible();
                });
            }
        );
    }
});
