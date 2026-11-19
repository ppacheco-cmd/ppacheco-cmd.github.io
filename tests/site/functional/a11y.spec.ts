import { expect, test } from '../../../fixtures/pom/test-options';
import {
    describeViolations,
    loadHtml,
    scanAccessibility,
} from '../../../helpers/site/a11y';
import { documentTheme } from '../../../helpers/site/browser';
import {
    A11yThemes,
    A11yViewports,
    AxeLimits,
    AxeRuleIds,
    CANARY_PAGE_HTML,
} from '../../../enums/site/a11y';
import { Questions } from '../../../enums/site/ask';
import { ColorSchemes } from '../../../enums/site/help';
import { ThemeValues } from '../../../enums/site/site';
import { MotionPreferences } from '../../../enums/site/theme';

/** Fails with a readable list of problems, and proves axe really evaluated rules */
const expectAccessible = async (
    scan: ReturnType<typeof scanAccessibility>
): Promise<void> => {
    const { violations, passedRules } = await scan;
    expect(violations, describeViolations(violations)).toEqual([]);
    expect(passedRules).toBeGreaterThan(AxeLimits.MIN_PASSED_RULES);
};

for (const [viewportName, viewport] of Object.entries(A11yViewports)) {
    for (const theme of A11yThemes) {
        test.describe(`axe: ${viewportName}, ${theme} theme`, () => {
            // Reduced motion removes colour transitions, so contrast is measured on settled colours
            test.use({
                viewport,
                colorScheme: theme,
                reducedMotion: MotionPreferences.REDUCE,
            });

            test(
                'should have no violations on the home page',
                { tag: '@smoke' },
                async ({ homePage, page }) => {
                    await homePage.open();
                    await expect.poll(() => documentTheme(page)).toBe(theme);
                    await expectAccessible(scanAccessibility(page));
                }
            );

            test(
                'should have no violations on the home page with a question answered',
                { tag: '@regression' },
                async ({ homePage, page }) => {
                    await homePage.open();
                    await homePage.askQuestion(Questions.MOBILE);
                    await expect(homePage.answerHeading).toBeVisible();
                    await expectAccessible(scanAccessibility(page));
                }
            );

            test(
                'should have no violations right after clicking the CV button (success state)',
                { tag: '@regression' },
                async ({ homePage, page }) => {
                    await homePage.open();
                    await homePage.cvButton.click();
                    await homePage.cvButton.confirmationShownAndVerify();
                    await expect(homePage.cvButton.doneLink).toBeVisible();
                    await expectAccessible(scanAccessibility(page));
                }
            );

            test(
                'should have no violations on the home page with the "?" help open',
                { tag: '@regression' },
                async ({ homePage, page }) => {
                    await homePage.open();
                    await homePage.help.toggle();
                    await expect(homePage.help.panel).toBeVisible();
                    await expectAccessible(scanAccessibility(page));
                }
            );

            test(
                'should have no violations on the resume page with the "?" help open',
                { tag: '@regression' },
                async ({ resumePage, page }) => {
                    await resumePage.open();
                    await resumePage.help.toggle();
                    await expect(resumePage.help.panel).toBeVisible();
                    await expectAccessible(scanAccessibility(page));
                }
            );

            test(
                'should have no violations on the resume page',
                { tag: '@smoke' },
                async ({ resumePage, page }) => {
                    await resumePage.open();
                    await expect.poll(() => documentTheme(page)).toBe(theme);
                    await expectAccessible(scanAccessibility(page));
                }
            );
        });
    }
}

test.describe('axe: a toggled theme is also accessible', () => {
    test.use({
        colorScheme: ColorSchemes.LIGHT,
        reducedMotion: MotionPreferences.REDUCE,
    });

    test(
        'should have no violations on the home page after switching from light to dark',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await homePage.open();
            await homePage.topBar.clickToggle();
            await expect.poll(() => documentTheme(page)).toBe(ThemeValues.DARK);
            await expectAccessible(scanAccessibility(page));
        }
    );
});

test.describe('axe canary: proves the scanner really catches problems', () => {
    test(
        'should flag low contrast and a missing image description in a deliberately bad page',
        { tag: '@regression' },
        async ({ page }) => {
            await loadHtml(page, CANARY_PAGE_HTML);
            const { violations } = await scanAccessibility(page);
            expect(violations.map((violation) => violation.id)).toEqual(
                expect.arrayContaining([
                    AxeRuleIds.CONTRAST,
                    AxeRuleIds.IMAGE_ALT,
                    AxeRuleIds.BUTTON_NAME,
                ])
            );
        }
    );
});
