// Language support: English (en-US), Portuguese (pt-PT), Spanish (es) and French (fr).
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

// A generic Portuguese-style phone number (+351 optional, 9 digits starting with 9). It catches any such number
// without writing a real one into this public repository.
const PHONE_LIKE = /(?:\+\s?351[\s.-]?)?(?<![\w.])9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}(?![\w])/;

// ---- the translation data, loaded the same way a browser would load it
function loadI18N() {
  const win = {};
  new Function('window', fs.readFileSync('assets/i18n.js', 'utf8'))(win);
  return win.I18N;
}
const I18N = loadI18N();
const CODES = ['en', 'pt', 'es', 'fr'];
const OTHER = ['pt', 'es', 'fr'];
const nb = (s) => s.replace(/ ([:;?!])/g, ' $1'); // French: no-break space before : ; ? !

// independent anchor strings, so a corrupted translation is noticed
const X = {
  pt: { tag: 'pt-PT', short: 'PT', langLabel: 'Idioma', navResume: 'Currículo', navAsk: 'Perguntas', cvIdle: 'Descarregar CV (PDF, em inglês)', cvIdleResume: 'Descarregar PDF (em inglês)', cvDone: 'Download iniciado', status: 'Download iniciado: PauloPacheco_CV.pdf', askTitle: 'Pergunte sobre o meu percurso', firstQ: 'Numa frase, quem é?', help: 'O que faz um QA Engineer?', toDark: 'Mudar para o modo escuro', toLight: 'Mudar para o modo claro', title: 'Paulo Pacheco', resumeTitle: 'Currículo - Paulo Pacheco', hExp: 'Experiência profissional', hLang: 'Idiomas e certificações', current: 'Atual', qaDates: 'nov. 2024 - jun. 2026', durQa: '1 ano e 8 meses', tools: 'Ferramentas', more: 'Ver o currículo completo', mobileStart: 'Não testei aplicações móveis a nível profissional' },
  es: { tag: 'es', short: 'ES', langLabel: 'Idioma', navResume: 'Currículum', navAsk: 'Preguntas', cvIdle: 'Descargar CV (PDF, en inglés)', cvIdleResume: 'Descargar PDF (en inglés)', cvDone: 'Descarga iniciada', status: 'Descarga iniciada: PauloPacheco_CV.pdf', askTitle: 'Pregunta sobre mi trayectoria', firstQ: 'En una frase, ¿quién eres?', help: '¿Qué hace un QA Engineer?', toDark: 'Cambiar a modo oscuro', toLight: 'Cambiar a modo claro', title: 'Paulo Pacheco', resumeTitle: 'Currículum - Paulo Pacheco', hExp: 'Experiencia profesional', hLang: 'Idiomas y certificaciones', current: 'Actualidad', qaDates: 'nov. 2024 - jun. 2026', durQa: '1 año y 8 meses', tools: 'Herramientas', more: 'Ver el currículum completo', mobileStart: 'No he probado aplicaciones móviles de forma profesional' },
  fr: { tag: 'fr', short: 'FR', langLabel: 'Langue', navResume: 'CV', navAsk: 'Questions', cvIdle: 'Télécharger le CV (PDF, en anglais)', cvIdleResume: 'Télécharger le PDF (en anglais)', cvDone: 'Téléchargement lancé', status: nb('Téléchargement lancé : PauloPacheco_CV.pdf'), askTitle: 'Posez des questions sur mon parcours', firstQ: nb('En une phrase, qui êtes-vous ?'), help: nb('Que fait un QA Engineer ?'), toDark: 'Passer en mode sombre', toLight: 'Passer en mode clair', title: 'Paulo Pacheco', resumeTitle: 'CV - Paulo Pacheco', hExp: 'Expérience professionnelle', hLang: 'Langues et certifications', current: 'Présent', qaDates: 'nov. 2024 - juin 2026', durQa: '1 an et 8 mois', tools: 'Outils', more: 'Voir le CV complet', mobileStart: "Je n'ai pas testé d'applications mobiles de façon professionnelle" },
};
const EN = { tag: 'en-US', short: 'EN', langLabel: 'Language', navResume: 'Resume', navAsk: 'Ask', cvIdle: 'Download CV (PDF)', cvDone: 'Download started', status: 'Download started: PauloPacheco_CV.pdf', askTitle: 'Ask about my background', firstQ: 'In one line, who are you?', help: 'What does a QA engineer do?', toDark: 'Switch to dark mode', toLight: 'Switch to light mode', title: 'Paulo Pacheco', resumeTitle: 'Resume - Paulo Pacheco' };

const sel = (page) => page.locator('#lang-select');
const open = async (page, path, lang) => { await page.goto(path); if (lang && lang !== 'en') { await sel(page).selectOption(lang); await expect(page.locator('html')).toHaveAttribute('data-lang', lang); } };

// =====================================================================================
test.describe('translation data', () => {
  test('all four languages have exactly the same keys and the same questions', () => {
    const base = Object.keys(I18N.DICT.en).filter((k) => k !== 'qa').sort();
    for (const c of OTHER) expect(Object.keys(I18N.DICT[c]).filter((k) => k !== 'qa').sort(), c).toEqual(base);
    const ids = I18N.DICT.en.qa.map((q) => q.id);
    for (const c of OTHER) expect(I18N.DICT[c].qa.map((q) => q.id), c).toEqual(ids);
    expect(ids).toHaveLength(9);
  });

  test('every key used in the pages exists in every language', () => {
    const used = new Set();
    for (const f of ['index.html', 'resume.html']) {
      const html = fs.readFileSync(f, 'utf8');
      for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) used.add(m[1]);
      for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) m[1].split(';').forEach((p) => used.add(p.split(':')[1]));
    }
    expect(used.size).toBeGreaterThan(60);
    for (const c of CODES) for (const k of used) expect(I18N.DICT[c][k], `${c}:${k}`).toBeTruthy();
  });

  test('no empty values, balanced bold/italic markup, no leftover placeholders', () => {
    for (const c of CODES) {
      for (const [k, v] of Object.entries(I18N.DICT[c])) {
        const values = k === 'qa' ? v.flatMap((q) => [q.q, q.a]) : [v];
        for (const s of values) {
          expect(s.trim().length, `${c}:${k}`).toBeGreaterThan(0);
          expect((s.match(/\*\*/g) || []).length % 2, `${c}:${k} bold`).toBe(0);
          expect((s.match(/__/g) || []).length % 2, `${c}:${k} italic`).toBe(0);
          expect(s, `${c}:${k}`).not.toMatch(/\bTODO\b|lorem ipsum|undefined|\[object/);
        }
      }
    }
  });

  test('translated text is really translated (only a few short labels may equal the English)', () => {
    const base = ['c.role', 'r.role.be', 'i.title']; // names kept in English on purpose
    const alsoSameWord = { pt: [], es: [], fr: ['r.via', 'r.h.publications'] }; // "(via Quanteam)" and "Publications" are French too
    for (const c of OTHER) {
      const allowed = new Set([...base, ...alsoSameWord[c]]);
      const same = Object.keys(I18N.DICT.en).filter((k) => k !== 'qa' && I18N.DICT[c][k] === I18N.DICT.en[k] && !allowed.has(k));
      expect(same, `${c}: untranslated keys`).toEqual([]);
      I18N.DICT.en.qa.forEach((q, i) => {
        expect(I18N.DICT[c].qa[i].q, `${c} question ${q.id}`).not.toBe(q.q);
        expect(I18N.DICT[c].qa[i].a, `${c} answer ${q.id}`).not.toBe(q.a);
      });
    }
  });

  test('every number from the English text is still in the translation (facts are preserved)', () => {
    const digits = (s) => s.match(/\d+/g) || [];
    for (const c of OTHER) {
      for (const k of Object.keys(I18N.DICT.en).filter((x) => x !== 'qa')) {
        const t = digits(I18N.DICT[c][k]);
        for (const d of digits(I18N.DICT.en[k])) expect(t, `${c}:${k} lost "${d}"`).toContain(d);
      }
      I18N.DICT.en.qa.forEach((q, i) => {
        const t = digits(I18N.DICT[c].qa[i].a);
        for (const d of digits(q.a)) expect(t, `${c}:qa:${q.id} lost "${d}"`).toContain(d);
      });
    }
  });

  test('product and tool names survive translation', () => {
    const names = ['Playwright', 'GitHub Actions', 'Sentry', 'Grafana', 'Jira', 'Pytest', 'Django', 'Android Studio', 'XRay', 'Gherkin', 'CHUSJ', 'Euronext', 'Promptly Health', 'ISTQB'];
    const resumeKeys = Object.keys(I18N.DICT.en).filter((k) => k.startsWith('r.') || k === 'c.help.intro');
    for (const c of OTHER) {
      const en = resumeKeys.map((k) => I18N.DICT.en[k]).join(' ') + I18N.DICT.en.qa.map((q) => q.a).join(' ');
      const tx = resumeKeys.map((k) => I18N.DICT[c][k]).join(' ') + I18N.DICT[c].qa.map((q) => q.a).join(' ');
      for (const n of names) if (en.includes(n)) expect(tx, `${c} lost "${n}"`).toContain(n);
    }
  });

  test('the wording stays gender-neutral and keeps the title "QA Engineer"', () => {
    // lookarounds instead of \b: \b does not treat accented letters (like the U in "Unico") as word characters
    const gendered = /(?<![\p{L}])(motivad[oa]|[uú]nic[oa] QA|engenheir[oa]|ingenier[oa] de|ingénieu?r[e]? QA|seul[e]? QA)(?![\p{L}])/iu;
    for (const c of OTHER) {
      expect(I18N.DICT[c]['c.role']).toBe('QA Engineer');
      for (const [k, v] of Object.entries(I18N.DICT[c])) {
        const values = k === 'qa' ? v.flatMap((q) => [q.q, q.a]) : [v];
        for (const s of values) expect(s, `${c}:${k}`).not.toMatch(gendered);
      }
    }
  });

  test('every character in every language can be set in the site font', () => {
    const css = fs.readFileSync('assets/site.css', 'utf8');
    const ranges = css.match(/unicode-range:\s*([^;]+);/)[1].split(',')
      .map((r) => r.trim().replace('U+', '').split('-').map((h) => parseInt(h, 16))).map(([a, b]) => [a, b ?? a]);
    const ok = (cp) => ranges.some(([a, b]) => cp >= a && cp <= b);
    const bad = new Set();
    for (const c of CODES) {
      const all = Object.entries(I18N.DICT[c]).flatMap(([k, v]) => (k === 'qa' ? v.flatMap((q) => [q.q, q.a]) : [v])).join(' ')
        + Object.values(I18N.MONTHS[c] || []).join(' ');
      for (const ch of all) if (!/\s/.test(ch) && !ok(ch.codePointAt(0))) bad.add(ch);
    }
    expect([...bad]).toEqual([]);
  });

  test('the English dictionary is exactly the English text written in the pages (no drift)', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'light' });
    for (const path of ['/', '/resume.html']) {
      const page = await ctx.newPage();
      // block the scripts so we see the raw HTML
      await page.route('**/assets/*.js', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
      await page.goto(path);
      const found = await page.evaluate(() => {
        const markup = (el) => Array.from(el.childNodes).map((n) => (n.nodeType === 3 ? n.textContent : n.tagName === 'STRONG' ? '**' + n.textContent + '**' : n.tagName === 'EM' ? '__' + n.textContent + '__' : n.textContent)).join('').replace(/\s+/g, ' ').trim();
        const out = {};
        document.querySelectorAll('[data-i18n]').forEach((el) => { out[el.getAttribute('data-i18n')] = markup(el); });
        document.querySelectorAll('[data-i18n-attr]').forEach((el) => el.getAttribute('data-i18n-attr').split(';').forEach((p) => { const [a, k] = p.split(':'); out[k] = el.getAttribute(a); }));
        return out;
      });
      expect(Object.keys(found).length).toBeGreaterThan(15);
      for (const [k, v] of Object.entries(found)) expect(I18N.DICT.en[k], `${path} ${k}`).toBe(v);
      await page.close();
    }
    await ctx.close();
  });
});

// =====================================================================================
test.describe('language switcher', () => {
  test.use({ colorScheme: 'light' });

  test('a labelled "Language" select with the four languages, English first and selected', async ({ page }) => {
    await page.goto('/');
    const select = page.getByRole('combobox', { name: 'Language' });
    await expect(select).toHaveCount(1);
    await expect(select).toHaveValue('en');
    await expect(select.locator('option')).toHaveText(['English', 'Português', 'Español', 'Français']);
    expect(await select.locator('option').evaluateAll((o) => o.map((x) => x.getAttribute('lang')))).toEqual(['en-US', 'pt-PT', 'es', 'fr']);
    expect(await select.locator('option').evaluateAll((o) => o.map((x) => x.value))).toEqual(['en', 'pt', 'es', 'fr']);
    await expect(page.locator('.lang-code')).toHaveText('EN');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  });

  test('it sits in the top bar between the nav links and the theme toggle', async ({ page }) => {
    await page.goto('/');
    const nav = await page.locator('.topnav').boundingBox();
    const lang = await page.locator('.lang').boundingBox();
    const tog = await page.locator('#theme-toggle').boundingBox();
    expect(lang.x).toBeGreaterThanOrEqual(nav.x + nav.width);
    expect(lang.x + lang.width).toBeLessThanOrEqual(tog.x + 12);
    expect(lang.height).toBeGreaterThanOrEqual(24);
  });

  test('switching language does not reload the page', async ({ page }) => {
    await page.goto('/');
    let navigations = 0;
    page.on('framenavigated', () => navigations++);
    await sel(page).selectOption('fr');
    await expect(page.locator('html')).toHaveAttribute('data-lang', 'fr');
    expect(navigations).toBe(0);
    expect(new URL(page.url()).search).toBe('');
  });

  test('the switcher is hidden without JavaScript (it could not work) and the English page is intact', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'light', locale: 'fr-FR' });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('.lang')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Ask about my background' })).toBeVisible();
    await ctx.close();
  });
});

// =====================================================================================
test.describe('choosing the language from the browser', () => {
  const CASES = [['pt-PT', 'pt', 'pt-PT'], ['pt-BR', 'pt', 'pt-PT'], ['es-ES', 'es', 'es'], ['es-MX', 'es', 'es'], ['fr-FR', 'fr', 'fr'], ['fr-CA', 'fr', 'fr'], ['en-GB', 'en', 'en-US'], ['de-DE', 'en', 'en-US'], ['ja-JP', 'en', 'en-US']];
  for (const [locale, code, tag] of CASES) {
    test(`browser language ${locale} opens the site in "${code}" (html lang="${tag}")`, async ({ browser }) => {
      const ctx = await browser.newContext({ locale, colorScheme: 'light' });
      const page = await ctx.newPage();
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-lang', code);
      await expect(page.locator('html')).toHaveAttribute('lang', tag);
      await expect(sel(page)).toHaveValue(code);
      await ctx.close();
    });
  }

  test('the first supported language in the browser preference list wins', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'de-DE', colorScheme: 'light' });
    await ctx.addInitScript(() => Object.defineProperty(navigator, 'languages', { get: () => ['de-DE', 'ja-JP', 'es-AR', 'fr-FR'] }));
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-lang', 'es');
    await ctx.close();
  });

  test('an explicit choice beats the browser language, and is remembered', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'es-ES', colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(sel(page)).toHaveValue('es');
    await sel(page).selectOption('en');
    expect(await page.evaluate(() => localStorage.getItem('lang'))).toBe('en');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-lang', 'en');
    await expect(page.getByRole('heading', { name: 'Ask about my background' })).toBeVisible();
    await ctx.close();
  });
});

// =====================================================================================
test.describe('?lang= in the address', () => {
  test.use({ colorScheme: 'light' });

  test('?lang=pt opens in Portuguese and is remembered', async ({ page }) => {
    await page.goto('/?lang=pt');
    await expect(page.locator('html')).toHaveAttribute('data-lang', 'pt');
    expect(await page.evaluate(() => localStorage.getItem('lang'))).toBe('pt');
    await page.goto('/resume.html'); // no parameter: still Portuguese
    await expect(page.getByRole('heading', { name: X.pt.hExp, level: 2 })).toBeVisible();
  });

  test('it overrides a saved choice', async ({ page }) => {
    await page.goto('/?lang=fr');
    await page.goto('/?lang=es');
    await expect(page.locator('html')).toHaveAttribute('data-lang', 'es');
  });

  test('upper case and region codes work (?lang=PT-pt)', async ({ page }) => {
    await page.goto('/?lang=PT-pt');
    await expect(page.locator('html')).toHaveAttribute('data-lang', 'pt');
  });

  test('an unknown language is ignored and nothing is saved', async ({ page }) => {
    await page.goto('/?lang=xx');
    await expect(page.locator('html')).toHaveAttribute('data-lang', 'en');
    expect(await page.evaluate(() => localStorage.getItem('lang'))).toBeNull();
    await page.goto('/?lang=<script>alert(1)</script>');
    await expect(page.locator('html')).toHaveAttribute('data-lang', 'en');
  });
});

// =====================================================================================
for (const code of OTHER) {
  const x = X[code];
  test.describe(`home page in ${code}`, () => {
    test.use({ colorScheme: 'light' });

    test('texts, labels, page title and description are translated', async ({ page }) => {
      await open(page, '/', code);
      await expect(page.locator('html')).toHaveAttribute('lang', x.tag);
      await expect(page.locator('.lang-code')).toHaveText(x.short);
      await expect(page.getByRole('combobox', { name: x.langLabel })).toHaveValue(code);
      await expect(page.locator('.topnav a')).toHaveText([x.navResume, x.navAsk]);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Paulo Pacheco');
      await expect(page.locator('.role')).toHaveText('QA Engineer');
      await expect(page.getByRole('heading', { name: x.askTitle })).toBeVisible();
      await expect(page).toHaveTitle(x.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', I18N.DICT[code]['i.desc']);
      await expect(page.locator('.brand')).toHaveAttribute('aria-label', I18N.DICT[code]['c.brand']);
      // nothing English is left in the visible interface text
      await expect(page.getByText('Ask about my background')).toHaveCount(0);
      await expect(page.getByText('Download CV (PDF)', { exact: true })).toHaveCount(0);
    });

    test('links keep their targets; only the labels change', async ({ page }) => {
      await open(page, '/', code);
      await expect(page.locator('.topnav a').first()).toHaveAttribute('href', 'resume.html');
      await expect(page.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/ppacheco-cmd');
      await expect(page.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', 'https://www.linkedin.com/in/palexpacheco/');
      await expect(page.locator('.links a').nth(1)).toHaveAttribute('href', /^mailto:/);
      await expect(page.locator('a[data-cv-link]')).toHaveAttribute('href', 'cv/PauloPacheco_CV.pdf');
    });

    test('the theme button is announced in this language, and stays translated after switching theme', async ({ page }) => {
      await open(page, '/', code);
      await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-label', x.toDark);
      await page.locator('#theme-toggle').click();
      await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-label', x.toLight);
    });

    test('the CV button: translated label, confirmation, screen-reader message, and it still downloads', async ({ page }) => {
      await open(page, '/', code);
      await expect(page.locator('.cv-btn')).toHaveAccessibleName(x.cvIdle);
      await expect(page.locator('.cv-btn')).toHaveAttribute('data-ready', 'true');
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('.cv-btn').click()]);
      expect(download.suggestedFilename()).toBe('PauloPacheco_CV.pdf');
      await expect(page.locator('.cv-btn')).toHaveAccessibleName(x.cvDone);
      await expect(page.locator('#cv-status')).toHaveText(x.status);
    });

    test('the "?" help explains the role in this language', async ({ page }) => {
      await open(page, '/', code);
      const help = page.getByRole('button', { name: x.help });
      await help.click();
      await expect(page.locator('#qa-help .help-title')).toHaveText(x.help);
      await expect(page.locator('#qa-help li')).toHaveCount(4);
      await expect(page.locator('#qa-help')).toContainText(I18N.DICT[code]['c.help.b3']);
    });

    test('the question chips and answers are in this language', async ({ page }) => {
      await open(page, '/', code);
      const qa = I18N.DICT[code].qa;
      await expect(page.locator('#chips .chip')).toHaveCount(9);
      await expect(page.locator('#chips .chip').first()).toHaveText(x.firstQ);
      for (let i = 0; i < qa.length; i++) {
        await page.locator('#chips .chip').nth(i).click();
        await expect(page.locator('#answer h3')).toHaveText(qa[i].q);
        await expect(page.locator('#answer')).toContainText(qa[i].a.split('\n\n')[0].slice(0, 60));
      }
      await expect(page.locator('#answer .answer-more a')).toHaveText(x.more);
      await expect(page.locator('#answer .answer-more a')).toHaveAttribute('href', 'resume.html');
    });

    test('the mobile answer is upfront that mobile testing is not professional experience', async ({ page }) => {
      await open(page, '/', code);
      await page.locator('#chips .chip').nth(6).click();
      await expect(page.locator('#answer')).toContainText(x.mobileStart);
      await expect(page.locator('#answer')).toContainText('Android Studio');
    });

    test('a chosen question stays chosen when the language changes (and is re-shown translated)', async ({ page }) => {
      await page.goto('/');
      await page.locator('#chips .chip').nth(2).click(); // "automation" in English
      await expect(page.locator('#answer h3')).toHaveText('Do you have test automation experience?');
      await sel(page).selectOption(code);
      await expect(page.locator('#chips .chip[aria-pressed="true"]')).toHaveCount(1);
      await expect(page.locator('#chips .chip[aria-pressed="true"]')).toHaveAttribute('data-id', 'automation');
      await expect(page.locator('#answer h3')).toHaveText(I18N.DICT[code].qa[2].q);
      await sel(page).selectOption('en');
      await expect(page.locator('#answer h3')).toHaveText('Do you have test automation experience?');
    });

    test('before any question is picked, the hint changes language too', async ({ page }) => {
      await open(page, '/', code);
      await expect(page.locator('.answer-hint')).toHaveText(I18N.DICT[code]['i.askHint']);
    });
  });

  test.describe(`resume page in ${code}`, () => {
    test.use({ colorScheme: 'light' });

    test('title, headings, summary and download button are translated', async ({ page }) => {
      await open(page, '/resume.html', code);
      await expect(page).toHaveTitle(x.resumeTitle);
      await expect(page.locator('main.resume > section > h2')).toHaveText([
        I18N.DICT[code]['r.h.summary'], I18N.DICT[code]['r.h.education'], x.hExp, I18N.DICT[code]['r.h.projects'], I18N.DICT[code]['r.h.publications'], x.hLang,
      ]);
      await expect(page.locator('#h-summary + p')).toHaveText(I18N.DICT[code]['r.summary']);
      await expect(page.locator('.cv-btn')).toHaveAccessibleName(x.cvIdleResume);
      await expect(page.locator('.topnav a[aria-current="page"]')).toHaveText(x.navResume);
    });

    test('dates, "current", durations and tool labels follow the language', async ({ page }) => {
      await open(page, '/resume.html', code);
      const jobs = page.locator('#h-experience ~ article.job');
      await expect(jobs.nth(0).locator('.job-meta')).toContainText(`${I18N.MONTHS[code][6]} 2026`);
      await expect(jobs.nth(0).locator('.job-meta')).toContainText(x.current);
      await expect(jobs.nth(1).locator('.job-meta')).toContainText(x.qaDates);
      await expect(jobs.nth(1).locator('.dur')).toHaveText(x.durQa);
      await expect(jobs.nth(0).locator('.job-tools span')).toHaveText(x.tools);
      // the <time> values themselves never change
      expect(await page.locator('time').evaluateAll((els) => els.map((e) => e.getAttribute('datetime')))).toEqual(
        ['2015-09', '2021-03', '2026-07', '2024-11', '2026-06', '2021-05', '2024-11', '2019-10', '2021-03']);
    });

    test('every bullet is translated, bold and italic parts are kept, and the facts are unchanged', async ({ page }) => {
      await open(page, '/resume.html', code);
      for (const pre of ['r.eu', 'r.pq', 'r.pb', 'r.pr']) {
        const count = { 'r.eu': 3, 'r.pq': 6, 'r.pb': 6, 'r.pr': 3 }[pre];
        for (let n = 1; n <= count; n++) {
          const li = page.locator(`li[data-i18n="${pre}.b${n}"]`);
          const expected = I18N.DICT[code][`${pre}.b${n}`].replace(/\*\*|__/g, '');
          await expect(li, `${pre}.b${n}`).toHaveText(expected);
        }
      }
      await expect(page.locator('li[data-i18n="r.eu.b1"] em')).toHaveText(['Gherkin', 'XRay']);
      await expect(page.locator('li[data-i18n="r.pq.b1"] strong')).toHaveCount(1);
      const jobs = page.locator('#h-experience ~ article.job');
      await expect(jobs.nth(1)).not.toContainText('60%'); // the unverified coverage figure was removed on purpose
      await expect(jobs.nth(2)).toContainText('~15%');
      await expect(page.locator('#h-projects ~ article')).toContainText('~16%');
      await expect(page.locator('.r-kv').first()).toContainText('B2');
    });

    test('names, links and tools lists are unchanged', async ({ page }) => {
      await open(page, '/resume.html', code);
      await expect(page.locator('.job h3 a').nth(1)).toHaveText('Euronext');
      await expect(page.getByRole('link', { name: 'ISTQB® Certified Tester Foundation Level 4.0' })).toBeVisible();
      await expect(page.locator('.job-tools').nth(1)).toContainText('GitHub, GitHub Actions, Agile, Jira, Playwright, Python, Postman, Sentry, Grafana, Claude Code');
      await expect(page.locator('.pub').first()).toContainText('Designing Effective User Interface Experiences'); // publication titles stay as published
      await expect(page.locator('.r-contact a').first()).toHaveAttribute('href', /^mailto:/);
    });

    test('the page contains no phone number in any language', async ({ page }) => {
      await open(page, '/resume.html', code);
      const text = await page.locator('body').innerText();
      expect(text).not.toMatch(PHONE_LIKE);
      expect(text).not.toContain('+351');
    });

    test('printing gives 2 pages, like the English version', async ({ browser }) => {
      const ctx = await browser.newContext({ colorScheme: 'dark' });
      const page = await ctx.newPage();
      await page.goto(`/resume.html?lang=${code}`);
      await expect(page.locator('html')).toHaveAttribute('data-lang', code);
      const pdf = await page.pdf({ format: 'A4', margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' } });
      expect((pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length).toBe(2);
      await ctx.close();
    });
  });
}

// =====================================================================================
test.describe('the choice carries across pages and sessions', () => {
  test.use({ colorScheme: 'light' });

  test('choose on the home page, open the resume from the menu: same language; back again: same', async ({ page }) => {
    await page.goto('/');
    await sel(page).selectOption('fr');
    await page.locator('.topnav a').first().click();
    await expect(page).toHaveURL(/resume\.html$/);
    await expect(page.locator('html')).toHaveAttribute('data-lang', 'fr');
    await expect(sel(page)).toHaveValue('fr');
    await expect(page.locator('main.resume > section > h2').first()).toHaveText('Profil');
    await sel(page).selectOption('pt');
    await page.locator('.brand').click();
    await expect(page.getByRole('heading', { name: X.pt.askTitle })).toBeVisible();
  });

  test('language and theme are independent choices', async ({ page }) => {
    await page.goto('/');
    await page.locator('#theme-toggle').click();
    await sel(page).selectOption('es');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-lang', 'es');
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-label', X.es.toLight);
  });

  test('switching back to English restores the original English text exactly', async ({ page }) => {
    await page.goto('/resume.html');
    const before = await page.locator('main.resume').innerText();
    await sel(page).selectOption('fr');
    await expect(page.locator('main.resume > section > h2').first()).toHaveText('Profil');
    await sel(page).selectOption('en');
    await expect(page.locator('main.resume > section > h2').first()).toHaveText('Summary');
    expect(await page.locator('main.resume').innerText()).toBe(before);
  });
});

// =====================================================================================
test.describe('no flash of English, and no page stuck hidden', () => {
  test('a non-English page is hidden until it is translated, then shown', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'fr-FR', colorScheme: 'light' });
    await ctx.route('**/assets/i18n.js', async (route) => { await new Promise((r) => setTimeout(r, 1200)); await route.continue(); });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-pending-lang'));
    expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe('hidden');
    await expect(page.getByRole('heading', { name: X.fr.askTitle })).toBeVisible({ timeout: 6000 });
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-pending-lang'))).toBe(false);
    expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe('visible');
    await ctx.close();
  });

  test('if the translations fail to load, the page still appears (in English) after a moment', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'pt-PT', colorScheme: 'light' });
    await ctx.route('**/assets/i18n.js', (r) => r.abort());
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ask about my background' })).toBeVisible({ timeout: 6000 });
    expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe('visible');
    // and the theme toggle still has a readable label
    expect(await page.locator('#theme-toggle').getAttribute('aria-label')).toMatch(/mode/i);
    await ctx.close();
  });

  test('English visitors are never hidden', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-pending-lang'))).toBe(false);
  });
});

// =====================================================================================
test.describe('top bar fits every language on small phones', () => {
  for (const width of [360, 390]) {
    for (const code of CODES) {
      for (const path of ['/', '/resume.html']) {
        test(`${code} ${path} at ${width}px: nothing overflows or overlaps`, async ({ browser }) => {
          const ctx = await browser.newContext({ viewport: { width, height: 800 }, colorScheme: 'light' });
          const page = await ctx.newPage();
          await page.goto(`${path}?lang=${code}`);
          await expect(page.locator('html')).toHaveAttribute('data-lang', code);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow).toBeLessThanOrEqual(0);
          const parts = ['.brand', '.topnav', '.lang', '#theme-toggle'];
          const boxes = [];
          for (const p of parts) boxes.push(await page.locator(p).first().boundingBox());
          for (const b of boxes) { expect(b.x).toBeGreaterThanOrEqual(0); expect(b.x + b.width).toBeLessThanOrEqual(width + 0.5); }
          for (let i = 0; i < boxes.length - 1; i++) expect(boxes[i].x + boxes[i].width, `${parts[i]} overlaps ${parts[i + 1]}`).toBeLessThanOrEqual(boxes[i + 1].x + 1);
          await ctx.close();
        });
      }
    }
  }
});

// =====================================================================================
test.describe('accessibility (axe) in every language', () => {
  const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
  for (const code of OTHER) {
    for (const [name, viewport, scheme] of [['desktop light', { width: 1280, height: 720 }, 'light'], ['phone dark', { width: 390, height: 844 }, 'dark']]) {
      test(`${code}, ${name}: home page (with an answer open) and resume page`, async ({ browser }) => {
        const ctx = await browser.newContext({ viewport, colorScheme: scheme, reducedMotion: 'reduce' });
        const page = await ctx.newPage();
        for (const path of ['/', '/resume.html']) {
          await page.goto(`${path}?lang=${code}`);
          await expect(page.locator('html')).toHaveAttribute('data-lang', code);
          if (path === '/') {
            await page.locator('#chips .chip').nth(1).click();
            await page.getByRole('button', { name: X[code].help }).click();
          }
          const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
          expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), `${code} ${path}`).toEqual([]);
        }
        await ctx.close();
      });
    }
  }

  test('the document language is always a valid code, and option languages too', async ({ page }) => {
    await page.goto('/');
    for (const [code, tag] of [['en', 'en-US'], ['pt', 'pt-PT'], ['es', 'es'], ['fr', 'fr']]) {
      await sel(page).selectOption(code);
      await expect(page.locator('html')).toHaveAttribute('lang', tag);
    }
  });
});
