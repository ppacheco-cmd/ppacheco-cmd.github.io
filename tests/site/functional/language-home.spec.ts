import { expect, test } from '../../../fixtures/pom/test-options';
import {
    documentDataLang,
    documentLangTag,
    metaDescription,
} from '../../../helpers/site/browser';
import { loadTranslations } from '../../../helpers/site/translations';
import { ColorSchemes } from '../../../enums/site/help';
import { AnswerPhrases, AskUi } from '../../../enums/site/ask';
import { CvButtonText } from '../../../enums/site/cv';
import {
    Anchors,
    EnglishAnchors,
    I18nCounts,
    OTHER_LANGUAGES,
    QuestionIndex,
} from '../../../enums/site/i18n';
import { HomeText, LanguageCodes } from '../../../enums/site/site';
import { ContentLinks } from '../../../enums/site/theme';

const { dictionaries } = loadTranslations();

/** Turns a link path such as `github.com/user` into a pattern that matches inside a URL */
const inUrl = (path: string): RegExp =>
    new RegExp(path.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'));

for (const code of OTHER_LANGUAGES) {
    const x = Anchors[code];
    const dictionary = dictionaries[code];

    test.describe(`Home page in ${code}`, () => {
        test.use({ colorScheme: ColorSchemes.LIGHT, locale: 'en-US' });

        test.beforeEach(async ({ homePage, page }) => {
            await homePage.open();
            await homePage.topBar.selectLanguage(code);
            await expect.poll(() => documentDataLang(page)).toBe(code);
        });

        test(
            'should translate the texts, labels, page title and description',
            { tag: '@smoke' },
            async ({ homePage, page }) => {
                const { topBar } = homePage;
                await expect.poll(() => documentLangTag(page)).toBe(x.tag);
                await expect(topBar.languageCode).toHaveText(x.short);
                await expect(topBar.languageSelect).toHaveAccessibleName(
                    x.langLabel
                );
                await expect(topBar.languageSelect).toHaveValue(code);
                await expect(topBar.navigationLinks).toHaveText([
                    x.navResume,
                    x.navAsk,
                ]);
                await expect(homePage.heading).toHaveText(HomeText.NAME);
                await expect(homePage.role).toHaveText(HomeText.ROLE);
                await expect(
                    homePage.askHeadingNamed(x.askTitle)
                ).toBeVisible();
                await expect(page).toHaveTitle(x.title);
                await expect
                    .poll(() => metaDescription(page))
                    .toBe(dictionary.strings['i.desc']);
                await expect(topBar.brandLink).toHaveAttribute(
                    'aria-label',
                    dictionary.strings['c.brand']
                );
                await expect(
                    page.getByText(EnglishAnchors.askTitle)
                ).toHaveCount(0);
                await expect(
                    page.getByText(CvButtonText.HOME_IDLE, { exact: true })
                ).toHaveCount(0);
            }
        );

        test(
            'should keep the link targets and change only the labels',
            { tag: '@regression' },
            async ({ homePage }) => {
                await expect(
                    homePage.topBar.navLinkNamed(x.navResume)
                ).toHaveAttribute('href', AskUi.MORE_HREF);
                await expect(homePage.gitHubLink).toHaveAttribute(
                    'href',
                    inUrl(ContentLinks.GITHUB_PATH)
                );
                await expect(homePage.linkedInLinkExact).toHaveAttribute(
                    'href',
                    inUrl(ContentLinks.LINKEDIN_PATH)
                );
                await expect(homePage.emailContactLink).toHaveAttribute(
                    'href',
                    new RegExp(ContentLinks.MAILTO_PATTERN)
                );
                await expect(homePage.cvButton.button).toHaveAttribute(
                    'href',
                    CvButtonText.HREF
                );
            }
        );

        test(
            'should announce the theme button in this language, also after switching theme',
            { tag: '@regression' },
            async ({ homePage }) => {
                await expect(homePage.topBar.themeToggle).toHaveAttribute(
                    'aria-label',
                    x.toDark
                );
                await homePage.topBar.clickToggle();
                await expect(homePage.topBar.themeToggle).toHaveAttribute(
                    'aria-label',
                    x.toLight
                );
            }
        );

        test(
            'should translate the CV button: label, confirmation and screen-reader message, and still download',
            { tag: '@regression' },
            async ({ homePage }) => {
                const { cvButton } = homePage;
                await expect(cvButton.button).toHaveAccessibleName(x.cvIdle);
                await cvButton.readyToSaveAndVerify();
                const download = await cvButton.clickAndWaitForDownload();
                expect(download.suggestedFilename()).toBe(CvButtonText.FILE);
                await expect(cvButton.button).toHaveAccessibleName(x.cvDone);
                await expect(cvButton.status).toHaveText(x.status);
            }
        );

        test(
            'should explain the role in the "?" help in this language',
            { tag: '@regression' },
            async ({ homePage }) => {
                const { help } = homePage;
                await help.buttonNamed(x.help).click();
                await expect(help.panelTitleNamed(x.help)).toBeVisible();
                await expect(help.panelItems).toHaveCount(
                    I18nCounts.HELP_BULLETS
                );
                await expect(help.panel).toContainText(
                    dictionary.strings['c.help.b3']
                );
            }
        );

        test(
            'should offer the question chips in this language',
            { tag: '@regression' },
            async ({ homePage }) => {
                await expect(homePage.questionChips).toHaveCount(
                    I18nCounts.QUESTIONS
                );
                await expect(homePage.chipNamed(x.firstQuestion)).toBeVisible();
            }
        );

        test(
            'should change the hint to this language before any question is picked',
            { tag: '@regression' },
            async ({ homePage }) => {
                await expect(homePage.answerHint).toHaveText(
                    dictionary.strings['i.askHint']
                );
            }
        );

        test(
            'should be upfront in this language that mobile testing is not professional experience',
            { tag: '@regression' },
            async ({ homePage }) => {
                await homePage.clickChip(dictionary.qa[QuestionIndex.MOBILE].q);
                await expect(homePage.answerPanel).toContainText(x.mobileStart);
                await expect(homePage.answerPanel).toContainText(
                    AnswerPhrases.MOBILE_TOOL
                );
            }
        );

        for (const [index, item] of dictionary.qa.entries()) {
            test(
                `should show question ${index + 1} and its answer in this language`,
                { tag: '@regression' },
                async ({ homePage }) => {
                    await homePage.clickChip(item.q);
                    await expect(homePage.answerHeading).toHaveText(item.q);
                    await expect(homePage.answerPanel).toContainText(
                        item.a.split('\n\n')[0].slice(0, 60)
                    );
                    await expect(homePage.answerLinks).toHaveText(x.more);
                    await expect(homePage.answerLinks).toHaveAttribute(
                        'href',
                        AskUi.MORE_HREF
                    );
                }
            );
        }
    });

    test.describe(`Home page: switching to ${code} with a question open`, () => {
        test.use({ colorScheme: ColorSchemes.LIGHT, locale: 'en-US' });

        test(
            'should keep the chosen question chosen and show it translated, and back',
            { tag: '@regression' },
            async ({ homePage }) => {
                const english = dictionaries.en;
                await homePage.open();

                await test.step('GIVEN I pick the automation question in English', async () => {
                    await homePage.clickChip(
                        english.qa[QuestionIndex.AUTOMATION].q
                    );
                    await expect(homePage.answerHeading).toHaveText(
                        EnglishAnchors.automationQuestion
                    );
                });

                await test.step('WHEN I switch language', async () => {
                    await homePage.topBar.selectLanguage(code);
                });

                await test.step('THEN the same question is still chosen, now translated', async () => {
                    await expect(homePage.pressedChips).toHaveCount(1);
                    await expect(homePage.pressedChips).toHaveAttribute(
                        'data-id',
                        english.qa[QuestionIndex.AUTOMATION].id
                    );
                    await expect(homePage.answerHeading).toHaveText(
                        dictionary.qa[QuestionIndex.AUTOMATION].q
                    );
                });

                await test.step('AND switching back restores the English', async () => {
                    await homePage.topBar.selectLanguage(LanguageCodes.EN);
                    await expect(homePage.answerHeading).toHaveText(
                        EnglishAnchors.automationQuestion
                    );
                });
            }
        );
    });
}
