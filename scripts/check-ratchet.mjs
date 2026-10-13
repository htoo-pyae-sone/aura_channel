#!/usr/bin/env node
/**
 * The 167-error ratchet, enforced.
 *
 * This codebase carries 167 pre-existing type errors from before this
 * session's work. They are not being fixed here — that is a separate,
 * large job — but the count must never grow, or a refactor silently
 * swallows another dozen and nobody notices until the pile is unclimbable.
 * Until now that rule was held only by remembering to run `astro check`,
 * which is not a rule at all.
 *
 * So: run it, parse the count, fail if it exceeds BASELINE. astro check
 * itself exits non-zero whenever errors exist, which would make CI red
 * forever; spawnSync lets us capture its output and judge the number
 * ourselves instead.
 *
 * A count BELOW baseline passes with a prompt to lower the constant —
 * progress should not be a CI failure. Raise BASELINE only alongside a
 * commit that explains what was added and why.
 */
import { spawnSync } from 'node:child_process';

/** Lower this when the count drops. Never raise it without justification. */
const BASELINE = 167;

const ASTRO = process.platform === 'win32' ? 'astro.cmd' : './node_modules/.bin/astro';

const res = spawnSync(ASTRO, ['check'], {
  encoding: 'utf8',
  maxBuffer: 128 * 1024 * 1024,
  shell: false,
});

const raw = `${res.stdout ?? ''}${res.stderr ?? ''}`;
const out = raw.replace(/\x1b\[[0-9;]*m/g, '');

if (res.error && res.error.code === 'ENOENT') {
  console.error(`✗ could not run \`${ASTRO}\` — run \`npm ci\` first.`);
  console.error(`  ${res.error.message}`);
  process.exit(1);
}

// "Result (18 files): - 167 errors" — tolerate plural/singular and the
// dash that Astro prefixes the count with.
const m = out.match(/(\d+)\s+errors?\b/);
if (!m) {
  console.error('✗ could not find an error count in astro check output:');
  console.error(out.slice(-2000) || '(no output at all)');
  process.exit(1);
}

const count = Number(m[1]);

if (count > BASELINE) {
  console.error(`✗ astro check: ${count} errors — ${count - BASELINE} NEW (baseline ${BASELINE})`);
  console.error('');
  console.error('  New errors must be fixed, not absorbed. Re-run to see them:');
  console.error('    npm run check');
  console.error('');
  // Show enough of the real output to act on without re-running.
  const lines = out.split('\n');
  console.error(lines.slice(Math.max(0, lines.length - 40)).join('\n'));
  process.exit(1);
}

if (count < BASELINE) {
  console.log(`✓ astro check: ${count} errors (baseline ${BASELINE}) — ${BASELINE - count} fewer than baseline.`);
  console.log(`  Lower BASELINE in scripts/check-ratchet.mjs to ${count} so the ratchet keeps tightening.`);
} else {
  console.log(`✓ astro check: ${count} errors (baseline ${BASELINE}, unchanged)`);
}
