import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('Theme toggle', () => {
    test.use({ colorScheme: 'light' });

    test.beforeEach(async ({ homePage }) => {
        await homePage.open();
    });

    test(
        'should switch to dark mode and back to light mode',
        { tag: '@regression' },
        async ({ homePage }) => {
            const { topBar } = homePage;

            await test.step('GIVEN the site starts in light mode', async () => {
                await expect(topBar.switchToDarkButton).toBeVisible();
            });

            await test.step('WHEN I switch to dark mode', async () => {
                await topBar.switchToDark();
            });

            await test.step('THEN the site is dark and offers the way back', async () => {
                await expect(topBar.switchToLightButton).toBeVisible();
            });

            await test.step('WHEN I switch back to light mode', async () => {
                await topBar.switchToLight();
            });

            await test.step('THEN the site is light again', async () => {
                await expect(topBar.switchToDarkButton).toBeVisible();
            });
        }
    );
});
