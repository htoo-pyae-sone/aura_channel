/**
 * Server-only catalog assembly: collection entries → sorted CatalogItems.
 *
 * Kept apart from catalog.ts because it pulls in getEpisodeData, whose eager
 * content glob (every season-*.json) must never reach the client bundle —
 * the browser only ever sees the flat index served by /catalog-index.json.
 */
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { getEpisodeData } from './episode-data';
import { sortCatalog } from './catalog';
import type { CatalogItem } from './catalog';

// Local layout fixtures (see scripts/make-sample-fixture.mjs) — dev-only.
const isSample = (id: string) => id.startsWith('zz-sample-');

function entryToItem(entry: CollectionEntry<'anime'>): CatalogItem {
  // Seasons can arrive out of order in the file, so sort once here — both the
  // card badge and the ordering read the same array.
  const seasons = getEpisodeData(entry).seasons;
  const sorted = seasons.length
    ? [...seasons].sort((a, b) => a.season - b.season)
    : [];
  // Card badge: the latest season's status/count wins when seasons exist —
  // Black Clover is "Ongoing" overall but its seasons run Completed → Ongoing.
  const latest = sorted.length ? sorted[sorted.length - 1] : null;
  return {
    slug: entry.id,
    title: entry.data.title,
    poster: entry.data.poster,
    type: entry.data.type,
    year: entry.data.year ?? null,
    status: latest?.status ?? entry.data.status ?? null,
    genres: entry.data.genres,
    rating: entry.data.rating ?? null,
    totalEpisodes: latest?.totalEpisodes ?? entry.data.totalEpisodes ?? null,
    seasons: sorted.map((s) => s.season),
  };
}

/** Every title as a plain card item, in grid order. The one source for both
 *  the server-rendered first page of cards and the fetched index. */
export async function loadCatalog(): Promise<CatalogItem[]> {
  const entries = (await getCollection('anime')).filter(
    (e) => import.meta.env.DEV || !isSample(e.id)
  );
  return sortCatalog(entries.map(entryToItem));
}
