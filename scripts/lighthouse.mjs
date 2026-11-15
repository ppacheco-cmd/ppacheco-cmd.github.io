// Lighthouse quality gate: audits both pages in mobile and desktop mode and fails
// (exit code 1) if a category drops below its threshold.
//   npm run lighthouse
// HTML reports are written to lighthouse-reports/ (ignored by git).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';

// LH_BASE / LH_PAGES let you audit another server (used to prove the gate can fail).
const PORT = 4173;
const BASE = process.env.LH_BASE || `http://127.0.0.1:${PORT}`;
// English plus one Portuguese and one French page, so translated pages are held to the same scores
const PAGES = process.env.LH_PAGES ? process.env.LH_PAGES.split(',') : ['/', '/resume.html', '/?lang=pt', '/resume.html?lang=fr'];
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const MIN = { performance: 0.9, accessibility: 1, 'best-practices': 0.95, seo: 1 };

async function serverUp() {
  try { return (await fetch(BASE + '/')).ok; } catch { return false; }
}

let server = null;
if (!process.env.LH_BASE && !(await serverUp())) {
  server = spawn('node', ['tests/serve.js'], { stdio: 'ignore' });
  for (let i = 0; i < 40 && !(await serverUp()); i++) await sleep(150);
  if (!(await serverUp())) { console.error('Could not start the local server'); process.exit(2); }
}

mkdirSync('lighthouse-reports', { recursive: true });
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });
const rows = [];
let failed = false;

try {
  for (const mode of ['mobile', 'desktop']) {
    for (const path of PAGES) {
      const result = await lighthouse(
        BASE + path,
        { port: chrome.port, logLevel: 'error', output: ['html'], onlyCategories: CATEGORIES },
        mode === 'desktop' ? desktopConfig : undefined,
      );
      const { lhr, report } = result;
      const name = `${mode}-${path === '/' ? 'home' : path.replace(/\W+/g, '')}`.replace(/^(mobile|desktop)-$/, '$1-home');
      writeFileSync(`lighthouse-reports/${name}.html`, Array.isArray(report) ? report[0] : report);

      const row = { page: path, mode };
      for (const cat of CATEGORIES) {
        const score = lhr.categories[cat].score;
        row[cat] = Math.round(score * 100);
        if (score < MIN[cat]) {
          failed = true;
          console.error(`\nBELOW THRESHOLD: ${mode} ${path} ${cat} = ${row[cat]} (needs ${MIN[cat] * 100})`);
          for (const ref of lhr.categories[cat].auditRefs) {
            const a = lhr.audits[ref.id];
            if (a.score !== null && a.score < 1 && ['binary', 'numeric'].includes(a.scoreDisplayMode)) {
              console.error(`  - ${a.title}${a.displayValue ? ' (' + a.displayValue + ')' : ''}`);
            }
          }
        }
      }
      rows.push(row);
    }
  }
} finally {
  await chrome.kill();
  if (server) server.kill();
}

console.table(rows);
console.log('Thresholds:', Object.entries(MIN).map(([k, v]) => `${k} >= ${v * 100}`).join(', '));
console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS');
process.exitCode = failed ? 1 : 0;
