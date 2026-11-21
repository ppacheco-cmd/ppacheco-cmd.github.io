import { expect, test } from '../../../fixtures/pom/test-options';
import { documentDataLang } from '../../../helpers/site/browser';
import { horizontalOverflow } from '../../../helpers/site/layout';
import { loadTranslations } from '../../../helpers/site/translations';
import {
    ColorSchemes,
    LayoutLimits,
    PhoneViewport,
} from '../../../enums/site/help';
import { OTHER_LANGUAGES } from '../../../enums/site/i18n';
import {
    PipelineAnchors,
    PipelineText,
    ProjectAnchors,
    ProjectLinkRules,
    ProjectTags,
    ProjectsText,
} from '../../../enums/site/projects';

const { dictionaries } = loadTranslations();

/** Turns a link path such as `github.com/user` into a pattern that matches inside a URL */
const inUrl = (path: string): RegExp =>
    new RegExp(path.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'));

test.describe('Projects section', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT, locale: 'en-US' });

    test.beforeEach(async ({ homePage }) => {
        await homePage.open();
    });

    test(
        'should present this website and its test suite as a project',
        { tag: '@smoke' },
        async ({ homePage }) => {
            await test.step('THEN the section and the card are shown with their text', async () => {
                await expect(homePage.projectsHeading).toHaveText(
                    ProjectsText.TITLE
                );
                await expect(homePage.projectsSection).toContainText(
                    ProjectsText.SUBTITLE
                );
                await expect(homePage.projectName).toHaveText(
                    ProjectsText.NAME
                );
                await expect(homePage.projectCard).toContainText(
                    ProjectsText.DESCRIPTION
                );
            });

            await test.step('AND the technologies are listed, in a labelled list', async () => {
                await expect(homePage.projectTagList).toHaveAccessibleName(
                    ProjectsText.TAGS_LABEL
                );
                await expect(homePage.projectTags).toHaveText([...ProjectTags]);
            });
        }
    );

    test(
        'should link to the repository and open it safely in a new tab',
        { tag: '@smoke' },
        async ({ homePage }) => {
            await expect(homePage.projectLink).toHaveText(ProjectsText.LINK);
            await expect(homePage.projectLink).toHaveAttribute(
                'href',
                inUrl(ProjectLinkRules.REPOSITORY_PATH)
            );
            await expect(homePage.projectLink).toHaveAttribute(
                'target',
                ProjectLinkRules.NEW_TAB
            );
            await expect(homePage.projectLink).toHaveAttribute(
                'rel',
                new RegExp(ProjectLinkRules.SAFE_REL)
            );
        }
    );

    test(
        'should come after the questions section',
        { tag: '@regression' },
        async ({ homePage }) => {
            await expect(homePage.projectsHeading).toBeVisible();
            await homePage.projectsComeAfterQuestionsAndVerify();
        }
    );
});

test.describe('Projects section on a phone', () => {
    test.use({
        viewport: { width: PhoneViewport.WIDTH, height: PhoneViewport.HEIGHT },
        colorScheme: ColorSchemes.LIGHT,
        locale: 'en-US',
    });

    test(
        'should fit the screen without scrolling sideways',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await homePage.open();
            await expect(homePage.projectCard).toBeVisible();
            await homePage.projectCardFitsViewportAndVerify();
            expect(await horizontalOverflow(page)).toBeLessThanOrEqual(
                LayoutLimits.MAX_HORIZONTAL_OVERFLOW
            );
        }
    );
});

for (const code of OTHER_LANGUAGES) {
    const dictionary = dictionaries[code];

    test.describe(`Projects section in ${code}`, () => {
        test.use({ colorScheme: ColorSchemes.LIGHT, locale: 'en-US' });

        test(
            'should be translated, with the technology names unchanged',
            { tag: '@regression' },
            async ({ homePage, page }) => {
                await homePage.open();
                await homePage.topBar.selectLanguage(code);
                await expect.poll(() => documentDataLang(page)).toBe(code);
                await expect(homePage.projectsHeading).toHaveText(
                    ProjectAnchors[code].title
                );
                await expect(homePage.projectName).toHaveText(
                    dictionary.strings['i.projName']
                );
                await expect(homePage.projectCard).toContainText(
                    dictionary.strings['i.projDesc']
                );
                await expect(homePage.projectTagList).toHaveAccessibleName(
                    dictionary.strings['i.projTags']
                );
                await expect(homePage.projectLink).toHaveText(
                    ProjectAnchors[code].link
                );
                await expect(homePage.projectTags).toHaveText([...ProjectTags]);
            }
        );
    });
}

test.describe('Pipelines block', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT, locale: 'en-US' });

    test(
        'should describe the three pipelines in order, with what each one runs',
        { tag: '@smoke' },
        async ({ homePage }) => {
            await homePage.open();
            await expect(homePage.pipelinesHeading).toHaveText(
                PipelineText.TITLE
            );
            await expect(homePage.projectsSection).toContainText(
                PipelineText.INTRO
            );
            await expect(homePage.pipelineNames).toHaveText([
                PipelineText.COMMIT_NAME,
                PipelineText.MAIN_NAME,
                PipelineText.NIGHT_NAME,
            ]);
            await expect(homePage.pipelineItems).toContainText([
                PipelineText.COMMIT_DESCRIPTION,
                PipelineText.MAIN_DESCRIPTION,
                PipelineText.NIGHT_DESCRIPTION,
            ]);
        }
    );
});

test.describe('Pipelines block on a phone', () => {
    test.use({
        viewport: { width: PhoneViewport.WIDTH, height: PhoneViewport.HEIGHT },
        colorScheme: ColorSchemes.LIGHT,
        locale: 'en-US',
    });

    test(
        'should stack the three pipelines without scrolling sideways',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await homePage.open();
            await expect(homePage.pipelineItems).toHaveCount(3);
            await expect(homePage.pipelinesHeading).toBeVisible();
            expect(await horizontalOverflow(page)).toBeLessThanOrEqual(
                LayoutLimits.MAX_HORIZONTAL_OVERFLOW
            );
        }
    );
});

for (const code of OTHER_LANGUAGES) {
    const dictionary = dictionaries[code];

    test.describe(`Pipelines block in ${code}`, () => {
        test.use({ colorScheme: ColorSchemes.LIGHT, locale: 'en-US' });

        test(
            'should be translated, with the same three pipelines',
            { tag: '@regression' },
            async ({ homePage, page }) => {
                await homePage.open();
                await homePage.topBar.selectLanguage(code);
                await expect.poll(() => documentDataLang(page)).toBe(code);
                await expect(homePage.pipelinesHeading).toHaveText(
                    PipelineAnchors[code].title
                );
                await expect(homePage.pipelineNames).toHaveText([
                    ...PipelineAnchors[code].names,
                ]);
                await expect(homePage.pipelineItems).toContainText([
                    dictionary.strings['i.pipeCommitDesc'],
                    dictionary.strings['i.pipeMainDesc'],
                    dictionary.strings['i.pipeNightDesc'],
                ]);
            }
        );
    });
}
