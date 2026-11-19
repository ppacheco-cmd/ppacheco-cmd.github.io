# Paulo Pacheco · QA Engineer

**Live site: [ppacheco-cmd.github.io](https://ppacheco-cmd.github.io)**

A QA engineer's personal site, built the way a QA engineer would build it: small, fast,
accessible, and **tested like it matters**.

No framework. No build step. No tracking. Just HTML, CSS and a little vanilla JavaScript,
guarded by 272 automated tests.

---

## What you'll find

|                         |                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| **Home**                | Who I am, a one-click CV download, and a row of questions you can tap to get answers about my work.   |
| **Resume**              | The full résumé as a web page, print-ready (two pages, in every language).                            |
| **Four languages**      | English, Portuguese (PT), Spanish and French. Auto-detected from your browser, or switch it yourself. |
| **Light and dark**      | Follows your system, remembers your choice.                                                           |
| **Save-only CV button** | Clicking it saves the PDF and confirms it. It never opens a stray tab.                                |

## Why the testing is the interesting part

The site is small on purpose, so the test suite can be strict.

- **Playwright** covers behaviour: the download flow, the Q&A chips, the "?" help, theme and language switching, phone layouts, and what happens with JavaScript turned off.
- **axe-core** runs WCAG 2.0–2.2 A/AA checks in every language, in light and dark, on desktop and phone.
- **Lighthouse** gates performance, accessibility, best practices and SEO. It scores 99–100 on the pages I measure.
- **Guard tests** keep the content honest: no phone number on any public page, consistent facts across the résumé and the Q&A, and no leftover placeholders.
- **I check that the tests can fail.** For the important guards I deliberately break the code and confirm a test goes red. A test that cannot fail proves nothing.

## Run it yourself

```bash
npm install
cp env/.env.example env/.env.dev   # first time only: points the tests at the local server

npm run serve         # http://localhost:4173
npm test              # TypeScript suite (page objects, tagged tests)
npm run test:smoke    # only @smoke tests
npm run test:legacy   # the original JavaScript suite (being migrated)
npm run lint          # ESLint + Prettier, zero warnings
npm run check         # lint + both suites + Lighthouse gate
```

Serve it over HTTP, as above. Opening `index.html` straight from disk can't do the save-only
download, because browsers block `fetch` on `file://`.

## How it's put together

```
index.html            home page
resume.html           web résumé
assets/
  site.css            themes, layout, print styles
  site.js             language, theme, CV button, help, Q&A chips
  theme-init.js       runs first in <head>, so there's no flash of the wrong theme or language
  i18n.js             translations (en, pt, es, fr)
  fonts/              Figtree, self-hosted (SIL OFL 1.1)
cv/                   the downloadable PDF
pages/                page objects and components (Playwright, TypeScript)
fixtures/             page objects registered as fixtures
enums/  config/       routes, repeated strings, environment-driven config
tests/site/           the TypeScript specs, one tag per test
legacy-tests/         the original JavaScript suite, migrated spec by spec
AGENTS.md  .claude/   rules and skills for AI coding agents (see below)
scripts/              static server, Lighthouse gate, framework checks
```

A few decisions worth a look:

- **Progressive enhancement.** Without JavaScript the page still reads, the CV link still downloads, and the "?" help hides itself rather than sit there doing nothing.
- **Translations are plain data.** Text is set with `textContent`, never injected as HTML, and a small `**bold**` / `__italic__` mini-markup covers emphasis.
- **Gender-neutral wording** in the translations, with French spacing rules respected.
- **Self-hosted font, no third-party requests.** The page loads nothing from other domains.
- **Public CV only.** The PDF in this repo leaves out my phone number on purpose.

## Built on agentic-playwright

The new test layer follows [agentic-playwright](https://github.com/idavidov13/agentic-playwright)
(MIT): page objects as fixtures, one tag per test, GIVEN / WHEN / THEN steps, and a written
"constitution" in `AGENTS.md` that AI coding agents must follow. A hook and the pre-commit
scan enforce the mechanical rules, such as no hard waits and no raw locators. Third-party notices
are in `NOTICE.md`.

## A note on the translations

They are carefully written, but I'm not a native speaker of every language here. If something
reads oddly, an issue or pull request is very welcome.

## Licence

The site's code and text are mine. The Figtree font is © its authors, under the
[SIL Open Font License 1.1](assets/fonts/Figtree-OFL.txt).

---

_Hiring for QA? The résumé is [right here](https://ppacheco-cmd.github.io/resume.html), and I'm easy to reach through the links on the home page._
