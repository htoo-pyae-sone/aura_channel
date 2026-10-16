/**
 * Episode data, sourced from per-season JSON files inside each title's folder.
 *
 * Layout:
 *   src/content/anime/<slug>/index.md        — title + synopsis
 *   src/content/anime/<slug>/season-1.json   — Season 1 (episodes + metadata)
 *   src/content/anime/<slug>/season-2.json   — Season 2
 *
 * Why folders: a title's files stay together and stay navigable no matter how
 * many titles or episodes exist, and editing one season never touches the
 * others. The season NUMBER comes from the filename (`season-<N>.json`), so a
 * title's seasons are simply its `season-*.json` files sorted by that number.
 *
 * Every season file is validated against the shared schema, so a bad bot code
 * or a wrong `format` fails the build with the file path — it never ships.
 *
 * A title with no season files falls back to the (optional) inline `episodes` /
 * `seasons` still allowed in its `.md` frontmatter.
 */
import type { CollectionEntry } from 'astro:content';
import { seasonFileSchema } from './episode-schema';
import type { Episode, Season, SeasonFile } from './episode-schema';

const BASE = '../content/anime/';

// Eagerly import every per-season file. Keys are the file paths, which is how
// we recover the owning title (the parent folder) and the season number.
const files = import.meta.glob<SeasonFile>('../content/anime/**/season-*.json', {
  import: 'default',
  eager: true,
});

const byTitle = new Map<string, Season[]>();

for (const [path, raw] of Object.entries(files)) {
  const rel = path.startsWith(BASE) ? path.slice(BASE.length) : path;
  const segs = rel.split('/'); // ["black-clover", "season-1.json"]
  const fileName = segs.pop() ?? ''; // "season-1.json"
  const id = segs.join('/'); // "black-clover"
  const num = /^season-(\d+)\.json$/.exec(fileName);
  if (!num) continue; // unreachable — the glob only matches season-<N>.json

  const parsed = seasonFileSchema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid season file ${path}:\n${detail}`);
  }

  // Season number from the filename; the rest (title/status/count/episodes)
  // from the file body.
  const season: Season = { season: Number(num[1]), ...parsed.data };
  const list = byTitle.get(id);
  if (list) list.push(season);
  else byTitle.set(id, [season]);
}

// Sort each title's seasons by number so file-name ordering never matters.
for (const list of byTitle.values()) list.sort((a, b) => a.season - b.season);

export type ResolvedEpisodes = {
  episodes: Episode[];
  seasons: Season[];
};

/**
 * Resolve an entry's episodes. Per-season files (when present) win and come
 * back as a fully-assembled `seasons` array; otherwise the inline frontmatter
 * `episodes` / `seasons` are used, so a title with no season files keeps
 * working.
 */
export function getEpisodeData(entry: CollectionEntry<'anime'>): ResolvedEpisodes {
  const seasons = byTitle.get(entry.id);
  if (seasons && seasons.length) {
    return { episodes: [], seasons };
  }
  return {
    episodes: entry.data.episodes ?? [],
    seasons: entry.data.seasons ?? [],
  };
}
