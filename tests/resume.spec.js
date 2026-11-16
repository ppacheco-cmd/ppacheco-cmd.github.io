const { test, expect } = require('@playwright/test');

// A generic Portuguese-style phone number (+351 optional, 9 digits starting with 9). It catches any such number
// without writing a real one into this public repository.
const PHONE_LIKE = /(?:\+\s?351[\s.-]?)?(?<![\w.])9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}(?![\w])/;

const SECTIONS = [
  'Summary',
  'Skills',
  'Education',
  'Professional Experience',
  'Projects',
  'Publications',
  'Languages & Certifications',
];

test.describe('resume page', () => {
  test.use({ colorScheme: 'light' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/resume.html');
  });

  test('title, name and role', async ({ page }) => {
    await expect(page).toHaveTitle('Resume - Paulo Pacheco');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Paulo Pacheco');
    await expect(page.locator('.r-head .role')).toHaveText('QA Engineer');
  });

  test('has the same sections as the CV, in the same order', async ({ page }) => {
    await expect(page.locator('main.resume > section > h2')).toHaveText(SECTIONS);
    // plain sentence-case headings, not tracked-out ALL-CAPS labels
    await expect(page.locator('main.resume > section > h2').first()).toHaveCSS('text-transform', 'none');
  });

  test('Skills section matches the CV: one line each for testing, tools and soft skills', async ({ page }) => {
    const rows = page.locator('#h-skills ~ .r-kv');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toHaveText('Testing: Test planning, test cases, functional, UAT, E2E regression, defect reporting and investigation');
    await expect(rows.nth(1)).toHaveText('Tools: Playwright, Python, GitHub Actions, XRay, Postman, Jira, Git');
    await expect(rows.nth(2)).toHaveText('Soft skills: Collaboration, attention to detail, analytical thinking');
  });

  test('dates use one format: three-letter months, and "Present" for the current job', async ({ page }) => {
    const times = await page.locator('time').allTextContents();
    for (const t of times) expect(t, t).toMatch(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/);
    await expect(page.locator('#h-experience ~ article.job').nth(0)).not.toContainText('Current');
  });

  test('lists the three jobs with the right dates and durations', async ({ page }) => {
    const jobs = page.locator('#h-experience ~ article.job');
    await expect(jobs).toHaveCount(3);

    await expect(jobs.nth(0)).toContainText('Euronext');
    await expect(jobs.nth(0)).toContainText('(via Quanteam)');
    await expect(jobs.nth(0)).toContainText('Jul 2026 - Present');

    await expect(jobs.nth(1)).toContainText('Promptly Health');
    await expect(jobs.nth(1)).toContainText('QA Engineer');
    await expect(jobs.nth(1)).toContainText('Nov 2024 - Jun 2026');
    await expect(jobs.nth(1)).toContainText('1 yr 8 mos');

    await expect(jobs.nth(2)).toContainText('Software Engineer - Backend');
    await expect(jobs.nth(2)).toContainText('May 2021 - Nov 2024');
    await expect(jobs.nth(2)).toContainText('3 yrs 7 mos');
  });

  test('key facts from the CV are present', async ({ page }) => {
    const body = page.locator('main.resume');
    await expect(body).toContainText('2 years in QA and 3+ years of prior backend engineering');
    await expect(body).toContainText('automated E2E regression suite covering critical user flows, run nightly');
    await expect(body).toContainText('multi-agent system to automate QA workflows');
    await expect(body).toContainText('Built a standalone Android app in Java');
    await expect(body).toContainText('Portuguese (Native), English - B2');
    await expect(body).toContainText('ISTQB');
  });

  test('does not expose a phone number', async ({ page }) => {
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(PHONE_LIKE);
    expect(text).not.toContain('+351');
    const html = await page.content();
    expect(html).not.toMatch(PHONE_LIKE);
    expect(html).not.toContain('tel:');
  });

  test('contact and download links are correct', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'pauloalexandre19333@gmail.com' })).toHaveAttribute('href', /^mailto:/);
    const li = page.locator('.r-contact').getByRole('link', { name: 'LinkedIn' });
    await expect(li).toHaveAttribute('href', 'https://www.linkedin.com/in/palexpacheco/');
    await expect(li).toHaveAttribute('rel', /noopener/);
    await expect(page.locator('.r-contact').getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/ppacheco-cmd');
    const pdf = page.getByRole('link', { name: 'Download PDF' });
    await expect(pdf).toHaveAttribute('href', 'cv/PauloPacheco_CV.pdf');
    await expect(pdf).toHaveAttribute('download', 'PauloPacheco_CV.pdf');
  });

  test('external links open safely in a new tab', async ({ page }) => {
    const external = page.locator('main.resume a[href^="http"]');
    const n = await external.count();
    expect(n).toBeGreaterThan(5);
    for (let i = 0; i < n; i++) {
      await expect(external.nth(i)).toHaveAttribute('target', '_blank');
      await expect(external.nth(i)).toHaveAttribute('rel', /noopener/);
    }
  });

  test('top bar marks Resume as the current page and links back home', async ({ page }) => {
    await expect(page.locator('.topnav').getByRole('link', { name: 'Resume' })).toHaveAttribute('aria-current', 'page');
    await page.locator('.brand').click();
    await expect(page).toHaveURL(/\/(index\.html)?$/);
  });

  test('structured data describes the person, without contact details', async ({ page }) => {
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(raw);
    expect(data['@type']).toBe('Person');
    expect(data.name).toBe('Paulo Pacheco');
    expect(data.jobTitle).toBe('QA Engineer');
    expect(data.sameAs).toContain('https://github.com/ppacheco-cmd');
    expect(raw).not.toMatch(/telephone|email/i);
    expect(raw).not.toMatch(PHONE_LIKE);
  });

  test('every <time> element has a valid ISO month', async ({ page }) => {
    const values = await page.locator('time').evaluateAll((els) => els.map((e) => e.getAttribute('datetime')));
    // Education 2, Euronext 1 (still current), Promptly QA 2, Promptly Backend 2, Project 2
    expect(values).toHaveLength(9);
    for (const v of values) expect(v).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });
});

test.describe('resume page: theme and print', () => {
  test('theme chosen on the home page carries over to the resume', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('.topnav').getByRole('link', { name: 'Resume' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(15, 17, 21)');
    await ctx.close();
  });

  test('the toggle works on the resume page too', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    const page = await ctx.newPage();
    await page.goto('/resume.html');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await ctx.close();
  });

  test('print view hides the top bar and download button, and is black on white even in dark mode', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    const page = await ctx.newPage();
    await page.goto('/resume.html');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('header.topbar')).toBeHidden();
    await expect(page.getByRole('link', { name: 'Download PDF' })).toBeHidden();
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.locator('body')).toHaveCSS('color', 'rgb(0, 0, 0)');
    await ctx.close();
  });

  test('print produces a compact PDF (2 pages, like the CV)', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    const page = await ctx.newPage();
    await page.goto('/resume.html');
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' },
    });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    expect(pages).toBe(2);
    await ctx.close();
  });
});

test.describe('resume page on a phone (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });

  test('nothing overflows sideways and the job dates stay inside the screen', async ({ page }) => {
    await page.goto('/resume.html');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    for (const meta of await page.locator('.job-meta').all()) {
      const b = await meta.boundingBox();
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(390);
    }
  });
});
