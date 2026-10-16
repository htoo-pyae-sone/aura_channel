#!/usr/bin/env node
/**
 * Generates the dev-only sample entry used to exercise layout at scale:
 * 16 seasons / 221 episodes, two download sources per episode, a long title
 * every 5th episode, varied season lengths (so pagination differs per season).
 *
 *   node scripts/make-sample-fixture.mjs    → writes the folder
 *
 * The entry is filtered out of production builds by its `zz-sample-` id
 * prefix (see src/pages/index.astro and src/pages/anime/[...slug].astro), so
 * it exists only while `astro dev` is running. `npm run smoke` creates it and
 * deletes it again — delete this file too when layout testing is done.
 *
 * The entry lives in a FOLDER (index.md + one season-<N>.json per season),
 * the same layout a real title uses, so the smoke test exercises the real
 * per-season loader path.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const FIXTURE_ID = 'zz-sample-10-seasons';
export const FIXTURE_DIR = fileURLToPath(
  new URL(`../src/content/anime/${FIXTURE_ID}/`, import.meta.url)
);
export const FIXTURE_PATH = fileURLToPath(
  new URL(`../src/content/anime/${FIXTURE_ID}/index.md`, import.meta.url)
);

// S1–S15 completed (varied lengths so pagination differs per season),
// S16 the ongoing season. S1 stays at 12 episodes for the pager checks.
const COUNTS = [12, 13, 11, 24, 12, 13, 12, 26, 11, 12, 13, 12, 11, 24, 12];
const ONGOING_EPS = 3;
const SEASONS = COUNTS.length + 1;

export function makeFixture() {
  const total = COUNTS.reduce((a, b) => a + b, 0) + ONGOING_EPS;
  mkdirSync(FIXTURE_DIR, { recursive: true });

  let globalEp = 0;
  for (let s = 1; s <= SEASONS; s++) {
    const ongoing = s === SEASONS;
    const eps = ongoing ? ONGOING_EPS : COUNTS[s - 1];
    const episodes = [];
    for (let e = 1; e <= eps; e++) {
      globalEp += 1;
      const title =
        e % 5 === 0
          ? `Sample Episode ${globalEp} - This Title Is Deliberately Long So You Can Check Truncation In The Row`
          : `Sample Episode ${globalEp}`;
      episodes.push({
        ep: e,
        title,
        downloads: [
          { source: 'Bot', format: 'mp4', quality: '1080p', size: '240 MB', link: 'GPvylVgduQJh' },
          { source: 'Mirror', format: 'mkv', quality: '720p', size: '120 MB', link: 'SAMPLE720x2' },
        ],
      });
    }
    // One file per season; the season number lives in the filename.
    const seasonFile = {
      title: `Season ${s}`,
      status: ongoing ? 'Ongoing' : 'Completed',
      totalEpisodes: ongoing ? '12+' : eps,
      episodes,
    };
    writeFileSync(
      `${FIXTURE_DIR}season-${s}.json`,
      JSON.stringify(seasonFile, null, 2) + '\n',
      'utf8'
    );
  }

  // index.md carries only scalar metadata + the synopsis — never the list.
  const lines = [];
  lines.push('---');
  lines.push(`title: "Sample Data - ${SEASONS} Seasons ${total} Episodes"`);
  lines.push('titleNative: "サンプル・データ"');
  lines.push('poster: "https://i.pinimg.com/736x/22/1c/98/221c982cde7a471c84303f9011efdccd.jpg"');
  lines.push('genres: ["Action", "Comedy", "Sci-Fi", "Slice of Life"]');
  lines.push('type: "Series"');
  lines.push('year: 2025');
  lines.push('status: "Ongoing"');
  lines.push('rating: 9.1');
  lines.push(`totalEpisodes: "${total}+"`);
  lines.push('aiAssisted: true');
  lines.push('---');
  lines.push('');
  lines.push(
    `Sample entry generated for layout testing — ${SEASONS} seasons and ${total} listed episodes, two download sources per episode, so season tabs, per-season pagination, the "N sources" hint and multi-row downloads can all be exercised at once.`
  );
  lines.push('');
  lines.push(
    `This folder (${FIXTURE_ID}/) is dev-only: it is filtered out of production builds, so \`astro dev\` shows it while \`npm run build\` never ships it. Regenerate with \`node scripts/make-sample-fixture.mjs\`. The episode lists live in season-<N>.json beside index.md.`
  );
  lines.push('');
  lines.push(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
  );
  lines.push('');
  lines.push(
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
  );
  lines.push('');

  writeFileSync(FIXTURE_PATH, lines.join('\n'), 'utf8');
  return { dir: FIXTURE_DIR, seasons: SEASONS, episodes: total };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = makeFixture();
  console.log(`wrote ${r.dir} → ${r.seasons} seasons, ${r.episodes} episodes`);
}
