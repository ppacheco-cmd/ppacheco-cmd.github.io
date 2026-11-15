const { test, expect } = require('@playwright/test');

const EXPECTED_QUESTIONS = [
  'In one line, who are you?',
  'What QA experience do you have?',
  'Do you have test automation experience?',
  'How do you use AI in your work?',
  'What is your healthcare background?',
  'Have you worked with APIs?',
  'Do you have mobile experience?',
  'Why did you move from backend to QA?',
  'Education, certification and languages?',
];

const chips = (page) => page.locator('#chips .chip');
const answer = (page) => page.locator('#answer');

test.describe('top bar navigation', () => {
  test.use({ colorScheme: 'light' });

  test('Resume link opens the resume page', async ({ page }) => {
    await page.goto('/');
    await page.locator('.topnav').getByRole('link', { name: 'Resume' }).click();
    await expect(page).toHaveURL(/\/resume\.html$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Paulo Pacheco');
  });

  test('Ask link scrolls to the questions section', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { name: 'Ask about my background' });
    await expect(heading).not.toBeInViewport();
    await page.locator('.topnav').getByRole('link', { name: 'Ask' }).click();
    await expect(page).toHaveURL(/#ask$/);
    await expect(heading).toBeInViewport({ ratio: 1 });
    // the sticky top bar must not cover the heading
    const bar = await page.locator('header.topbar').boundingBox();
    const h = await heading.boundingBox();
    expect(h.y).toBeGreaterThanOrEqual(bar.y + bar.height);
  });

  test('there is exactly one Resume link on the home page (no duplicate in the hero)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Resume', exact: true })).toHaveCount(1);
    await expect(page.locator('.topnav').getByRole('link', { name: 'Resume', exact: true })).toHaveCount(1);
    await expect(page.locator('.links a')).toHaveText(['LinkedIn', 'Email']);
  });

  test('the download button says it is a PDF, and the web version is called Resume', async ({ page }) => {
    await page.goto('/');
    const dl = page.getByRole('link', { name: 'Download CV (PDF)', exact: true });
    await expect(dl).toBeVisible();
    await expect(dl).toHaveAttribute('href', 'cv/PauloPacheco_CV.pdf');
  });
});

test.describe('question chips', () => {
  test.use({ colorScheme: 'light' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows all questions, none selected, with a hint', async ({ page }) => {
    await expect(chips(page)).toHaveText(EXPECTED_QUESTIONS);
    for (const c of await chips(page).all()) {
      await expect(c).toHaveAttribute('aria-pressed', 'false');
    }
    await expect(answer(page)).toContainText('Select a question above');
  });

  test('clicking a chip shows its question and answer, and marks it pressed', async ({ page }) => {
    const chip = page.getByRole('button', { name: 'Do you have test automation experience?' });
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(answer(page).getByRole('heading', { level: 3 })).toHaveText('Do you have test automation experience?');
    await expect(answer(page)).toContainText('Playwright and GitHub Actions');
    await expect(answer(page)).toContainText('nightly');
    await expect(answer(page)).not.toContainText('Select a question above');
  });

  test('only one chip is pressed at a time and the answer is replaced', async ({ page }) => {
    await page.getByRole('button', { name: 'Have you worked with APIs?' }).click();
    await page.getByRole('button', { name: 'Do you have mobile experience?' }).click();
    await expect(page.locator('#chips .chip[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Do you have mobile experience?' })).toHaveAttribute('aria-pressed', 'true');
    await expect(answer(page)).toContainText('Android');
    await expect(answer(page)).not.toContainText('Postman');
  });

  test('every chip produces a non-empty answer that links to the resume', async ({ page }) => {
    for (const question of EXPECTED_QUESTIONS) {
      await page.getByRole('button', { name: question, exact: true }).click();
      await expect(answer(page).getByRole('heading', { level: 3 })).toHaveText(question);
      const text = (await answer(page).innerText()).trim();
      expect(text.length, question).toBeGreaterThan(120);
      const more = answer(page).getByRole('link', { name: 'See the full resume', exact: true });
      await expect(more).toHaveAttribute('href', 'resume.html'); // plain wording, no arrow
    }
  });

  test('the answer region announces changes to screen readers', async ({ page }) => {
    await expect(answer(page)).toHaveAttribute('aria-live', 'polite');
  });

  test('works with the keyboard (Tab to a chip, Enter selects it)', async ({ page }) => {
    await chips(page).first().focus();
    await page.keyboard.press('Tab');
    await expect(chips(page).nth(1)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(chips(page).nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(answer(page)).toContainText('QA');
  });

  test('chips and answers are theme aware (selected chip uses the accent colour)', async ({ page }) => {
    await chips(page).first().click();
    await expect(chips(page).first()).toHaveCSS('background-color', 'rgb(59, 91, 134)');
    await page.locator('#theme-toggle').click();
    await expect(chips(page).first()).toHaveCSS('background-color', 'rgb(126, 160, 209)');
  });
});

test.describe('honesty and privacy guards on the answers', () => {
  async function allAnswers(page) {
    await page.goto('/');
    return page.evaluate(() => JSON.parse(document.getElementById('qa-data').textContent));
  }

  test('no phone number in any answer', async ({ page }) => {
    const data = await allAnswers(page);
    for (const item of data) {
      expect(item.a + item.q, item.id).not.toMatch(/\+?351|\b9\d{8}\b|\b\d{3}\s?\d{3}\s?\d{3}\b/);
    }
  });

  test('every item has an id, a question and an answer, and ids are unique', async ({ page }) => {
    const data = await allAnswers(page);
    expect(data.length).toBe(EXPECTED_QUESTIONS.length);
    expect(new Set(data.map((d) => d.id)).size).toBe(data.length);
    for (const item of data) {
      expect(item.id).toBeTruthy();
      expect(item.q.endsWith('?')).toBe(true);
      expect(item.a.length).toBeGreaterThan(100);
      expect(item.a).not.toMatch(/TODO|lorem|XXX/i);
    }
  });

  test('the mobile answer is upfront that mobile testing is not professional experience', async ({ page }) => {
    const data = await allAnswers(page);
    const mobile = data.find((d) => d.id === 'mobile');
    expect(mobile.a).toMatch(/haven't tested mobile apps professionally/);
    expect(mobile.a).toMatch(/Android Studio/);
  });

  test('numbers quoted in the answers match the resume page', async ({ page, request }) => {
    const data = await allAnswers(page);
    const resume = await (await request.get('/resume.html')).text();
    const all = data.map((d) => d.a).join(' ');
    for (const claim of ['~60%', 'B2', 'Playwright', 'ISTQB', 'XRay', 'Gherkin']) {
      if (all.includes(claim)) expect(resume, `resume should also contain "${claim}"`).toContain(claim);
    }
  });
});

test.describe('phone width', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });

  test('chips wrap, nothing overflows sideways, answers stay readable', async ({ page }) => {
    await page.goto('/#ask');
    await chips(page).nth(4).click();
    await expect(answer(page)).toContainText('Promptly Health');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const box = await answer(page).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });
});
