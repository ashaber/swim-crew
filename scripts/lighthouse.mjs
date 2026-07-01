// Repeatable Lighthouse check: builds the app, serves the production build,
// audits it, and fails the run if performance or best-practices regress.
//
// Accessibility/SEO scores are printed but not gated: the low scores here are
// known, intentional tradeoffs (dark-theme color contrast, no-pinch-zoom
// mobile UX, and a Disallow-all robots.txt for this private crew tool) rather
// than defects -- see CLAUDE.md.
import { execSync, spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

// This host's ambient TMPDIR/TMP/TEMP sometimes resolve to a WSL interop UNC
// path (e.g. \\wsl.localhost\Ubuntu\tmp) rather than a real Linux path, which
// makes os.tmpdir() -- and anything that trusts it, including chrome-launcher
// -- create directories with that literal, broken name. Pin to a real path
// before anything (including our own mkdtempSync below) can read it.
process.env.TMPDIR = '/tmp';
delete process.env.TMP;
delete process.env.TEMP;

const PORT = 4322;
const BASE_URL = `http://localhost:${PORT}`;
const THRESHOLDS = { performance: 90, 'best-practices': 90 };

console.log('Building production bundle...');
execSync('npm run build', { stdio: 'inherit', cwd: new URL('..', import.meta.url) });

const preview = spawn('npm', ['run', 'preview', '--', '--port', String(PORT), '--strictPort'], {
  cwd: new URL('..', import.meta.url),
  stdio: 'pipe',
});

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) return;
    } catch {}
    await sleep(500);
  }
  throw new Error('preview server did not come up in time');
}

const userDataDir = mkdtempSync(join(tmpdir(), 'lighthouse-chrome-'));

let exitCode = 0;
try {
  await waitForServer();

  const chrome = await chromeLauncher.launch({
    chromePath: process.env.CHROME_PATH,
    chromeFlags: ['--headless=new', '--no-sandbox'],
    userDataDir,
  });

  const result = await lighthouse(BASE_URL, {
    port: chrome.port,
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    screenEmulation: { disabled: true },
  });

  await chrome.kill();

  const scores = {};
  for (const [key, cat] of Object.entries(result.lhr.categories)) {
    scores[key] = Math.round(cat.score * 100);
  }

  console.log('\nLighthouse scores:');
  for (const [key, score] of Object.entries(scores)) {
    console.log(`  ${key.padEnd(16)} ${score}`);
  }

  for (const [key, min] of Object.entries(THRESHOLDS)) {
    if (scores[key] < min) {
      console.error(`\nFAIL: ${key} scored ${scores[key]}, below required ${min}`);
      console.error(`Failing/low audits in "${key}":`);
      for (const ref of result.lhr.categories[key].auditRefs) {
        const audit = result.lhr.audits[ref.id];
        if (audit.score !== null && audit.score < 0.9) {
          console.error(`  - ${audit.title} (score ${audit.score}) ${audit.displayValue || ''}`);
          for (const item of audit.details?.items ?? []) {
            if (item.node?.selector) console.error(`      element: ${item.node.selector}`);
          }
        }
      }
      exitCode = 1;
    }
  }
  if (exitCode === 0) console.log('\nAll gated categories meet threshold.');
} finally {
  preview.kill();
  rmSync(userDataDir, { recursive: true, force: true });
  cleanupStrayTmpDirs();
}

process.exit(exitCode);

// Defensive safety net: this host's kernel string makes chrome-launcher's
// isWsl() check true, so it passes our userDataDir through toWin32Path()
// before handing it to Chrome as --user-data-dir. There's no real Windows
// interop here, so Chrome (a real Linux binary) gets a garbled path and
// creates a literal "C:\Users\..." or "\\wsl.localhost\..." directory in the
// CWD instead of writing to userDataDir. Sweep those up so they never leak
// into git status.
function cleanupStrayTmpDirs() {
  const projectRoot = fileURLToPath(new URL('..', import.meta.url));
  for (const name of readdirSync(projectRoot)) {
    if (name.startsWith('C:') || name.includes('wsl.localhost')) {
      rmSync(join(projectRoot, name), { recursive: true, force: true });
    }
  }
}
