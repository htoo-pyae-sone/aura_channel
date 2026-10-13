#!/usr/bin/env node
/**
 * Enforces the rule documented in src/styles/global.css:130.
 *
 * `-webkit-backdrop-filter` and `backdrop-filter` are aliases, and the CSS
 * minifier keeps whichever is written LAST. Chrome 156+ ignores the prefixed
 * form entirely (measured: it computes to `none`), so if the prefix wins the
 * dedupe the blur works in dev — which serves CSS unminified, both rules
 * present — and silently disappears from the production build. That exact
 * bug shipped once (fixed in 0e647bf) and is currently only held back by a
 * comment, which is a warning nobody is forced to read.
 *
 * This fails the build when, within a single rule:
 *   1. the prefixed declaration comes AFTER the standard one, or
 *   2. the two carry different values.
 *
 * Generic on purpose: it pairs any `-webkit-X` with an `X` in the same
 * block, so a new alias (mask-image, appearance, …) is covered without
 * editing a watchlist. Rules with only one of the two are not flagged —
 * unprefixed-only is fine, that is what modern browsers want.
 */
import { readFileSync } from 'node:fs';

const FILE = process.argv[2] ?? 'src/styles/global.css';

/**
 * Replace comments with equal-length blanks (newlines preserved), so every
 * offset and line number below still maps to the real file. The comment at
 * global.css:130 quotes both property names and would otherwise register as
 * a phantom declaration.
 */
function blankComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

const lineOf = (css, index) => css.slice(0, index).split('\n').length;
const norm = (v) => v.replace(/\s+/g, ' ').trim();

/** Innermost `{ … }` bodies — CSS has no nested braces except inside
 *  @media/@supports, whose own body holds no declarations. */
function ruleBodies(css) {
  return [...css.matchAll(/\{([^{}]*)\}/g)].map((m) => ({
    body: m[1],
    offset: m.index + 1,
  }));
}

const source = readFileSync(FILE, 'utf8');
const css = blankComments(source);

const violations = [];
let pairs = 0;

for (const { body, offset } of ruleBodies(css)) {
  const decls = [...body.matchAll(/([-\w]+)\s*:\s*([^;{}]*);?/g)]
    .filter((m) => m[2] !== undefined && m[2] !== '')
    .map((m) => ({
      prop: m[1],
      value: norm(m[2]),
      index: offset + m.index,
    }));

  for (const [i, d] of decls.entries()) {
    if (!d.prop.startsWith('-webkit-')) continue;
    const base = d.prop.slice('-webkit-'.length);
    const j = decls.findIndex((o) => o.prop === base);
    if (j === -1) continue; // no pair in this rule — nothing to order

    pairs += 1;
    const where = `${FILE}:${lineOf(css, d.index)}`;

    if (j < i) {
      violations.push(
        `${where}  \`${base}\` is written BEFORE \`-webkit-${base}\`.\n` +
          `          Standard property must come LAST — if it does not, the minifier ` +
          `keeps the prefixed one, and Chrome 156+ ignores that.`
      );
      continue;
    }

    if (d.value !== decls[j].value) {
      violations.push(
        `${where}  \`-webkit-${base}\` is \`${d.value}\` but \`${base}\` is ` +
          `\`${decls[j].value}\`.\n` +
          `          Aliases must match, or the two browsers disagree.`
      );
    }
  }
}

if (violations.length) {
  console.error(`✗ ${FILE}: ${violations.length} prefix violation(s)\n`);
  for (const v of violations) console.error(`  ${v}\n`);
  console.error('  Fix: write the -webkit- declaration first, the standard one last.');
  process.exit(1);
}

console.log(`✓ ${FILE}: ${pairs} prefixed/unprefixed pair(s), all ordered standard-last`);
