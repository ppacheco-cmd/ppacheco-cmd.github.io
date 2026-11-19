import { expect, test } from '../../../fixtures/pom/test-options';
import {
    computedStyle,
    documentTheme,
    iconShapeStyle,
} from '../../../helpers/site/browser';
import { horizontalOverflow } from '../../../helpers/site/layout';
import {
    ColorSchemes,
    LayoutLimits,
    PhoneViewport,
    ThemeColors,
} from '../../../enums/site/help';
import { ThemeValues } from '../../../enums/site/site';
import { MotionPreferences, CssValues } from '../../../enums/site/theme';

test.describe('Motion: no decorative entrance animation', () => {
    for (const reducedMotion of Object.values(MotionPreferences)) {
        test.describe(`with motion preference "${reducedMotion}"`, () => {
            test.use({ reducedMotion });

            test(
                'should show the hero content immediately, with nothing animating on load',
                { tag: '@regression' },
                async ({ homePage }) => {
                    await homePage.open();
                    for (const element of [
                        homePage.heading,
                        homePage.role,
                        homePage.cvLink,
                    ]) {
                        await expect(element).toHaveCSS(
                            'animation-name',
                            CssValues.NONE
                        );
                        await expect(element).toHaveCSS(
                            'opacity',
                            CssValues.OPAQUE
                        );
                    }
                }
            );
        });
    }

    test(
        'should change the button colour on hover without moving it',
        { tag: '@regression' },
        async ({ homePage }) => {
            await homePage.open();
            const before = await homePage.cvLink.boundingBox();
            await homePage.cvLink.hover();
            // No `waitForTimeout`: a hover lift would show as a transform, which the
            // assertion retries on until it settles.
            await expect(homePage.cvLink).toHaveCSS(
                'transform',
                CssValues.NONE
            );
            const after = await homePage.cvLink.boundingBox();
            expect(after?.y).toBe(before?.y);
        }
    );
});

test.describe('Phone layout', () => {
    test.use({
        viewport: { width: PhoneViewport.WIDTH, height: PhoneViewport.HEIGHT },
        colorScheme: ColorSchemes.LIGHT,
    });

    test(
        'should stack the buttons at full width and not overflow sideways',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await homePage.open();
            await homePage.buttonsStackFullWidthAndVerify();
            expect(await horizontalOverflow(page)).toBeLessThanOrEqual(
                LayoutLimits.MAX_HORIZONTAL_OVERFLOW
            );
        }
    );

    test(
        'should keep the top bar and the toggle usable',
        { tag: '@regression' },
        async ({ homePage, page }) => {
            await homePage.open();
            await expect(homePage.topBar.brandLink).toBeVisible();
            await homePage.topBar.clickToggle();
            await expect.poll(() => documentTheme(page)).toBe(ThemeValues.DARK);
        }
    );
});

test.describe('Hero links have icons', () => {
    test.use({ colorScheme: ColorSchemes.LIGHT });

    test.beforeEach(async ({ homePage }) => {
        await homePage.open();
    });

    test(
        'should show a decorative LinkedIn icon before its label',
        { tag: '@regression' },
        async ({ homePage }) => {
            await homePage.contactIconSitsBeforeLabelAndVerify(
                homePage.linkedInLinkExact,
                homePage.linkedInIcon
            );
            await expect(homePage.linkedInIcon).toHaveClass(/ico-fill/);
        }
    );

    test(
        'should show a decorative Email icon before its label',
        { tag: '@regression' },
        async ({ homePage }) => {
            await homePage.contactIconSitsBeforeLabelAndVerify(
                homePage.emailLinkExact,
                homePage.emailIcon
            );
            await expect(homePage.emailIcon).toHaveClass(/ico-stroke/);
        }
    );

    test(
        'should colour the icons like the text, including on hover',
        { tag: '@regression' },
        async ({ homePage }) => {
            await test.step('GIVEN the LinkedIn icon matches its text colour', async () => {
                expect(
                    await iconShapeStyle(homePage.linkedInIcon, 'fill')
                ).toBe(
                    await computedStyle(homePage.linkedInLinkExact, 'color')
                );
            });

            await test.step('WHEN I hover the link', async () => {
                await homePage.linkedInLinkExact.hover();
            });

            await test.step('THEN the text and the icon both take the accent colour', async () => {
                await expect(homePage.linkedInLinkExact).toHaveCSS(
                    'color',
                    ThemeColors.ACCENT_LIGHT
                );
                await expect
                    .poll(() => iconShapeStyle(homePage.linkedInIcon, 'fill'))
                    .toBe(ThemeColors.ACCENT_LIGHT);
            });

            await test.step('AND the Email icon outline matches its text colour', async () => {
                expect(await computedStyle(homePage.emailIcon, 'stroke')).toBe(
                    await computedStyle(homePage.emailLinkExact, 'color')
                );
            });
        }
    );

    test(
        'should keep plain link names and be big enough to tap',
        { tag: '@regression' },
        async ({ homePage }) => {
            await expect(homePage.linkedInLinkExact).toBeVisible();
            await expect(homePage.emailLinkExact).toBeVisible();
            await homePage.contactLinksAreTappableAndVerify();
        }
    );
});
