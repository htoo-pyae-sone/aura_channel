#!/usr/bin/env node
/**
 * Smoke checks for the catalog + detail-page work.
 *
 *   npm run smoke              → makes the 16-season fixture, starts its own
 *                                 dev server (port 4399), runs every check,
 *                                 then removes both again.
 *   npm run smoke -- --keep     → leaves the fixture behind for eyeballing.
 *   npm run smoke -- --only=x   → run just the checks whose name contains x.
 *
 * One-time setup: npx playwright install chromium   (playwright is a devDep)
 *
 * Exit code 1 if any check fails, so it can gate CI.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { makeFixture, FIXTURE_DIR } from './make-sample-fixture.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4399;
const BASE = `http://localhost:${PORT}`;
const ALT = `http://127.0.0.1:${PORT}`;
const SAMPLE = '/anime/zz-sample-10-seasons/';
const BC = '/anime/black-clover/';
const LOVE = '/anime/love-unseen-beneath-the-clear-night-sky/';
const KEEP = process.argv.includes('--keep');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const results = [];
const errors = [];

function track(page, tag) {
  page.on('pageerror', (e) => errors.push(`${tag}: ${e}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // Third-party assets (poster CDNs) can fail on a flaky network or VPN —
    // that's environmental, not our code. A failed load from OUR origin, and
    // any JS error, still fails the run.
    const where = m.location()?.url || '';
    if (/Failed to load resource/.test(text) && !where.startsWith(BASE)) return;
    errors.push(`${tag} console: ${text} (${where})`);
  });
}

async function open(browser, url, opts = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 }, ...opts });
  track(page, url);
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
  await page.waitForTimeout(400);
  return page;
}

async function check(name, fn) {
  if (ONLY && !name.includes(ONLY)) return;
  try {
    const detail = await fn();
    results.push({ name, ok: true });
    console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`);
  } catch (err) {
    results.push({ name, ok: false });
    console.log(`  ❌ ${name} — ${err.message || err}`);
  }
}

async function reachable() {
  // dev logs say localhost (v6) — probe both, IPv4 fallback.
  for (const url of [BASE, ALT]) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (r.ok) return true;
    } catch {
      /* try the next one */
    }
  }
  return false;
}

async function startServer() {
  // Reuse anything already listening on our port (e.g. a previous run).
  if (await reachable()) return null;

  const bin = path.join(ROOT, 'node_modules', '.bin', 'astro');
  // --ignore-lock: a dev server may already be running for the user on 4321;
  // this flag neither checks nor writes the lock file, so both can coexist.
  const child = spawn(bin, ['dev', '--port', String(PORT), '--ignore-lock'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  let out = '';
  child.stdout.on('data', (d) => (out += d));
  child.stderr.on('data', (d) => (out += d));

  for (let i = 0; i < 200; i++) {
    if (child.exitCode !== null) {
      throw new Error(`astro dev exited (${child.exitCode}): ${out.trim().slice(-400)}`);
    }
    if (await reachable()) return child;
    await sleep(200);
  }
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {}
  throw new Error(`dev server never came up: ${out.trim().slice(-400)}`);
}

function stopServer(child) {
  if (!child) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    /* already gone */
  }
}

async function runChecks(browser) {
  // --- 1. layout -----------------------------------------------------------
  await check('no horizontal overflow (4 pages × 4 widths)', async () => {
    const bad = [];
    for (const w of [1280, 768, 390, 320]) {
      for (const url of ['/', BC, LOVE, SAMPLE]) {
        const p = await open(browser, url, { viewport: { width: w, height: 900 } });
        const over = await p.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        if (over > 1) bad.push(`${url}@${w} +${over}px`);
        await p.close();
      }
    }
    assert(!bad.length, bad.join(', '));
    return '16 combinations clean';
  });

  // --- 2. season strip -----------------------------------------------------
  await check('season strip scrolls, page does not (390)', async () => {
    const p = await open(browser, SAMPLE, { viewport: { width: 390, height: 844 } });
    const r = await p.evaluate(() => {
      const s = document.querySelector('.season-tabs');
      const cs = getComputedStyle(s);
      const fade = cs.maskImage || cs.webkitMaskImage || 'none';
      return {
        hidden: s.scrollWidth - s.clientWidth,
        cls: s.className,
        fade,
        over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    await p.close();
    assert(r.hidden > 20, `strip not scrollable (${r.hidden}px)`);
    assert(r.cls.includes('is-scrollable'), `class: ${r.cls}`);
    assert(r.fade !== 'none', `edge fade missing: ${r.fade}`);
    assert(r.over <= 1, `page overflows +${r.over}px`);
    return `${r.hidden}px behind the edge fade`;
  });

  await check('End key moves focus to S16 and reveals it', async () => {
    const p = await open(browser, SAMPLE, { viewport: { width: 390, height: 844 } });
    await p.locator('.season-tab').first().focus();
    await p.keyboard.press('End');
    await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const s = document.querySelector('.season-tabs');
      const a = document.activeElement;
      const b = a.getBoundingClientRect();
      const sr = s.getBoundingClientRect();
      return {
        tab: (a.textContent || '').trim(),
        visible: b.left >= sr.left - 1 && b.right <= sr.right + 1,
      };
    });
    await p.close();
    assert(r.tab === 'S16', `focused ${r.tab}`);
    assert(r.visible, 'focused tab scrolled out of view');
    return `${r.tab} in view`;
  });

  // --- 3. controls row -----------------------------------------------------
  await check('EP jump shares the pills row when the strip overflows', async () => {
    const p = await open(browser, SAMPLE, { viewport: { width: 390, height: 844 } });
    const r = await p.evaluate(() => {
      const row = document.querySelector('.season-row');
      const j = document.querySelector('.ep-jump').getBoundingClientRect();
      const m = document.querySelector('.season-meta:not([hidden])').getBoundingClientRect();
      return {
        tight: row.classList.contains('is-tight'),
        delta: Math.abs(j.top + j.height / 2 - (m.top + m.height / 2)),
      };
    });
    await p.close();
    assert(r.tight, 'row not marked is-tight');
    assert(r.delta < 3, `jump ${r.delta}px off the pills' centre`);
    return 'centres aligned';
  });

  // --- 4. titles -----------------------------------------------------------
  await check('every title is one line + … (390, touch)', async () => {
    const p = await open(browser, SAMPLE, {
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 2,
    });
    const r = await p.evaluate(() => {
      const titles = [
        ...document.querySelectorAll('.ep-accordion:not([hidden]) .ep-title'),
      ];
      const long = document.querySelector('.ep-accordion[data-ep="5"] .ep-title');
      return {
        count: titles.length,
        multiLine: titles.filter((t) => t.getBoundingClientRect().height > 30).length,
        ellipsis: getComputedStyle(long).textOverflow,
        clipped: long.scrollWidth - long.clientWidth,
        gliding: document.querySelectorAll('.ep-title.gliding').length,
        rows: [...document.querySelectorAll('.ep-accordion:not([hidden])')]
          .slice(1)
          .map((r) => Math.round(r.getBoundingClientRect().height)),
      };
    });
    await p.close();
    assert(r.multiLine === 0, `${r.multiLine} titles wrap to 2+ lines`);
    assert(r.ellipsis === 'ellipsis', `text-overflow: ${r.ellipsis}`);
    assert(r.clipped > 50, 'fixture title no longer truncates (fixture wrong?)');
    assert(r.gliding === 0, `${r.gliding} titles left in .gliding state`);
    assert(new Set(r.rows).size === 1, `row heights differ: ${[...new Set(r.rows)]}`);
    return `${r.count} rows, all 1 line, long one ellipsized`;
  });

  await check('touch: expanding a row glides the title out, collapsing restores', async () => {
    const p = await open(browser, SAMPLE, {
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const sel = '.ep-accordion[data-ep="5"] ';
    await p.tap(sel + 'summary');
    await p.waitForTimeout(3600);
    const out = await p.evaluate(() => {
      const t = document.querySelector('.ep-accordion[data-ep="5"] .ep-title');
      return { x: Math.round(t.scrollLeft), gliding: t.classList.contains('gliding') };
    });
    await p.tap(sel + 'summary');
    await p.waitForTimeout(3800);
    const back = await p.evaluate(() => {
      const t = document.querySelector('.ep-accordion[data-ep="5"] .ep-title');
      return {
        x: Math.round(t.scrollLeft),
        gliding: t.classList.contains('gliding'),
        overflow: getComputedStyle(t).textOverflow,
      };
    });
    await p.close();
    assert(out.x > 50 && out.gliding, `open: x=${out.x} gliding=${out.gliding}`);
    assert(back.x === 0 && !back.gliding && back.overflow === 'ellipsis', JSON.stringify(back));
    return `out ${out.x}px → back to ${back.x} + ellipsis`;
  });

  await check('hover: glides out and back (900px)', async () => {
    const p = await open(browser, SAMPLE, { viewport: { width: 900, height: 950 } });
    const sel = '.ep-accordion[data-ep="5"]';
    const clipped = await p.evaluate(
      () => document.querySelector('.ep-accordion[data-ep="5"] .ep-title').scrollWidth -
        document.querySelector('.ep-accordion[data-ep="5"] .ep-title').clientWidth
    );
    await p.locator(sel).scrollIntoViewIfNeeded();
    await p.hover(sel + ' summary');
    await p.waitForTimeout(3600);
    const out = await p.evaluate(
      () => Math.round(document.querySelector('.ep-accordion[data-ep="5"] .ep-title').scrollLeft)
    );
    await p.mouse.move(5, 5);
    await p.waitForTimeout(3800);
    const back = await p.evaluate(() => {
      const t = document.querySelector('.ep-accordion[data-ep="5"] .ep-title');
      return { x: Math.round(t.scrollLeft), overflow: getComputedStyle(t).textOverflow };
    });
    await p.close();
    assert(clipped > 50, 'nothing to glide at this width');
    assert(out > 50, `hover did not glide (x=${out})`);
    assert(back.x === 0 && back.overflow === 'ellipsis', JSON.stringify(back));
    return `out ${out}px → back to ${back.x}`;
  });

  // --- 5. pager ------------------------------------------------------------
  await check('pager navigates between episode pages and stays on the list (390)', async () => {
    const p = await open(browser, SAMPLE, { viewport: { width: 390, height: 844 } });
    const state = () =>
      p.evaluate(() => {
        const sec = document.querySelector('.episodes-section');
        return {
          first: document.querySelector('.ep-accordion')?.dataset.ep,
          count: document.querySelector('.ep-count')?.textContent,
          url: location.pathname,
          secTop: sec ? Math.round(sec.getBoundingClientRect().top) : null,
          scrollY: Math.round(window.scrollY),
        };
      });
    const before = await state();
    await p.locator('.ep-pager').scrollIntoViewIfNeeded();
    await p.waitForTimeout(200);
    await Promise.all([p.waitForURL((u) => u.pathname.endsWith('/2/')), p.click('.ep-page-btn[rel="next"]')]);
    await p.waitForTimeout(500);
    const fwd = await state();
    await Promise.all([
      p.waitForURL((u) => !/\/2\/?$/.test(u.pathname)),
      p.click('.ep-page-btn[rel="prev"]'),
    ]);
    await p.waitForTimeout(500);
    const back = await state();
    await p.close();
    assert(before.first === '01' || before.first === '1', `start first EP ${before.first}`);
    assert(fwd.url.endsWith('/2/'), `next landed on ${fwd.url}`);
    assert(fwd.first === '11', `first row after > is EP ${fwd.first}`);
    assert(/Showing 11–12 of 12/.test(fwd.count || ''), `count: ${fwd.count}`);
    // The view must stay on the episode list — not jump to the top of the page.
    assert(fwd.scrollY > 300, `page change left us at the top (scrollY=${fwd.scrollY})`);
    assert(
      fwd.secTop != null && fwd.secTop >= 0 && fwd.secTop < 160,
      `episodes not parked near the top (secTop=${fwd.secTop})`
    );
    assert(back.first === '01' || back.first === '1', `first row after < is EP ${back.first}`);
    return `> → ${fwd.url} (EP ${fwd.first}, list at ${fwd.secTop}px), < → EP ${back.first}`;
  });

  // --- 5b. season tabs hold still ------------------------------------------
  // Unlike the pager (which parks at the list top on purpose), tapping another
  // season must not move the viewport: the new season's list appears at the
  // same height the old one left.
  await check('season tap holds the viewport still (no up/down jump)', async () => {
    const p = await open(browser, SAMPLE);
    await p.evaluate(() => {
      const sec = document.querySelector('.episodes-section');
      if (!sec) throw new Error('no .episodes-section');
      window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY + 500);
    });
    await p.waitForTimeout(100);
    const before = await p.evaluate(() => window.scrollY);
    assert(before > 100, `could not scroll mid-list (y=${before})`);
    // Programmatic click on purpose: Playwright's own click would first
    // scroll the tab strip back into view, moving the very position measured.
    await p.evaluate(() => {
      const tab = document.querySelector('.season-tab:not([aria-current])');
      if (!tab) throw new Error('no other-season tab');
      tab.click();
    });
    await p.waitForURL((u) => /\/s2\//.test(u.pathname));
    await p.waitForTimeout(400);
    const after = await p.evaluate(() => window.scrollY);
    await p.close();
    assert(Math.abs(after - before) < 8, `viewport jumped: ${before} → ${after}`);
    return `S1 y=${before} → S2 y=${after}`;
  });

  // --- 6. deep links -------------------------------------------------------
  // Deep links narrow the catalog but must NOT yank the filter panel open —
  // the standing chip row names what's active instead.
  await check('deep links narrow the catalog and name the filter, panel closed', async () => {
    const cases = [
      ['/?genre=Action', 'genre', 'Action'],
      ['/?year=2025', 'year', '2025'],
      ['/?q=Sample', 'search', 'Sample'],
    ];
    const seen = [];
    for (const [url, kind, value] of cases) {
      const p = await open(browser, url);
      // The filtered grid now renders from the lazily-fetched index, so wait
      // for the chip row (only renderPage() produces it) before measuring.
      await p.waitForFunction(() => {
        const el = document.getElementById('active-filters');
        return !!el && !el.hidden;
      });
      const r = await p.evaluate(() => ({
        open: !document.getElementById('filter-panel').hidden,
        rowHidden: document.getElementById('active-filters').hidden,
        chips: [...document.querySelectorAll('#active-filters .af-chip')]
          .map((c) => c.textContent.replace(/\s+/g, ' ').trim()),
        genre: document.getElementById('filter-genre').value,
        year: document.getElementById('filter-year').value,
        search: document.querySelector('.header-search-input')?.value || '',
        // The catalog no longer prints a "Showing 1-3 of 3" line (page numbers
        // say where you are instead), so read the count defensively — it is
        // only ever used to enrich the assertion message below.
        count: document.getElementById('cat-count')?.textContent?.trim() || '(no count line)',
        cards: document.querySelectorAll('#catalog-grid > *').length,
      }));
      await p.close();
      assert(!r.open, `${url}: filter panel was opened unasked`);
      assert(!r.rowHidden, `${url}: no filter chip row`);
      assert(r.chips.length === 1, `${url}: chips=[${r.chips}]`);
      if (kind === 'genre') assert(r.genre === value, `${url}: select=${r.genre}`);
      if (kind === 'year') assert(r.year === value, `${url}: select=${r.year}`);
      if (kind === 'search') assert(r.search === value, `${url}: input=${r.search}`);
      assert(r.cards > 0, `${url}: no cards (${r.count})`);
      seen.push(`${value}→${r.cards}`);
    }
    return seen.join(', ');
  });

  // --- 6b. home ships cards, index is lazy --------------------------------
  // The home page must carry its first page of cards in the HTML (readable
  // and clickable before any script runs), NOT re-embed the old inline
  // catalog-data JSON — and a small catalog must not fetch the index it
  // doesn't need.
  await check('home ships cards in the HTML and reads fine without JS', async () => {
    const p = await open(browser, '/');
    const r = await p.evaluate(() => ({
      inlineJSON: !!document.getElementById('catalog-data'),
      cards: document.querySelectorAll('#catalog-grid > .card').length,
      fetchUsed: performance
        .getEntriesByType('resource')
        .some((e) => e.name.includes('/catalog-index.json')),
    }));
    await p.close();
    assert(!r.inlineJSON, 'inline catalog-data JSON is back');
    assert(r.cards > 0, 'no server-rendered cards in the HTML');
    assert(!r.fetchUsed, 'a small catalog fetched the index it did not need');

    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const np = await ctx.newPage();
    await np.goto(BASE + '/', { waitUntil: 'load' });
    const noJs = await np.evaluate(() => ({
      cards: document.querySelectorAll('#catalog-grid > .card').length,
      href: document.querySelector('#catalog-grid > .card')?.getAttribute('href') || '',
    }));
    await ctx.close();
    assert(noJs.cards > 0, `no-JS home shows ${noJs.cards} cards`);
    assert(noJs.href.startsWith('/anime/'), `no-JS card href=${noJs.href}`);
    return `${r.cards} cards in HTML, ${noJs.cards} clickable without JS`;
  });

  // --- 7. reduced motion ---------------------------------------------------
  await check('reduced-motion: paging settles instantly (no animated scroll)', async () => {
    const p = await open(browser, SAMPLE, {
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    });
    await p.locator('.ep-pager').scrollIntoViewIfNeeded();
    await p.waitForTimeout(300);
    await Promise.all([
      p.waitForURL((u) => u.pathname.endsWith('/2/')),
      p.click('.ep-page-btn[rel="next"]'),
    ]);
    await p.waitForTimeout(150);
    const early = await p.evaluate(() => window.scrollY);
    await p.waitForTimeout(700);
    const settled = await p.evaluate(() => window.scrollY);
    await p.close();
    assert(
      Math.abs(early - settled) < 3,
      `still moving at 150ms (${early} → ${settled})`
    );
    return `top settled at y=${settled}`;
  });

  // --- 8. production build -------------------------------------------------
  await check('production build excludes the fixture', async () => {
    const b = spawnSync('npm', ['run', 'build'], { cwd: ROOT, encoding: 'utf8' });
    assert(b.status === 0, `build failed:\n${(b.stderr || '').split('\n').slice(-4).join('\n')}`);
    const g = spawnSync('grep', ['-rl', 'Sample Data', path.join(ROOT, 'dist')], {
      encoding: 'utf8',
    });
    assert(g.status !== 0 || !g.stdout.trim(), `fixture leaked into dist:\n${g.stdout}`);
    // The catalog index must ship as its own file, carry no fixture, and the
    // home page must keep the cards inline instead of the old JSON blob.
    const idx = path.join(ROOT, 'dist', 'catalog-index.json');
    assert(existsSync(idx), 'dist/catalog-index.json missing');
    assert(
      !readFileSync(idx, 'utf8').includes('zz-sample'),
      'fixture leaked into catalog-index.json'
    );
    const home = readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
    assert(!home.includes('id="catalog-data"'), 'inline catalog-data JSON is back in dist');
    assert(home.includes('class="card"'), 'dist/index.html has no server-rendered cards');
    return 'build ✅, 0 fixture refs, lazy index shipped';
  });

  // --- 9. runtime health ---------------------------------------------------
  await check('no console or page errors', async () => {
    assert(!errors.length, errors.slice(0, 3).join(' | '));
    return 'clean';
  });
}

async function main() {
  const fixture = makeFixture();
  console.log(
    `\nsmoke: fixture ${fixture.seasons} seasons / ${fixture.episodes} episodes → ${path.relative(ROOT, fixture.dir)}`
  );

  let server = null;
  let browser = null;
  try {
    server = await startServer();
    console.log(`smoke: dev server on ${BASE}\n`);
    browser = await chromium.launch();
    await runChecks(browser);
  } finally {
    if (browser) await browser.close();
    stopServer(server);
    await sleep(600);
    if (!KEEP && existsSync(FIXTURE_DIR)) rmSync(FIXTURE_DIR, { recursive: true, force: true });
    console.log(KEEP ? 'smoke: fixture kept (--keep)' : 'smoke: fixture removed');
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error('smoke failed to run:', err);
  process.exit(1);
});
