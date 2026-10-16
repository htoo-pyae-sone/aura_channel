/**
 * Client-safe catalog pieces: the plain card-item shape, the grid's ordering,
 * and the card markup. Shared by the server (which renders the first cards
 * straight into the home page) and the browser script (which re-renders after
 * a filter/search/page change), so the two can never drift apart.
 *
 * Everything here must stay import-safe for the client bundle: no
 * astro:content, no content globs. The server-only mapping from a collection
 * entry to a CatalogItem lives in catalog-server.ts.
 */
import { epLabel } from './episodes';
// Shared with the detail page's poster <img> so both fallbacks point at the
// same file and cannot drift.
import { POSTER_FALLBACK } from '../config';

/** One title as the grid sees it: everything a card shows or a filter reads,
 *  and nothing else. Assembled server-side (see catalog-server.ts). */
export type CatalogItem = {
  slug: string;
  title: string;
  poster: string;
  type: string;
  year: number | null;
  status: string | null;
  genres: string[];
  rating: number | null;
  totalEpisodes: number | string | null;
  seasons: number[];
};

// The grid groups by status — Upcoming first as a coming-soon billboard, then
// Ongoing, then Completed — and runs A-Z inside each group, so a title added
// later slots itself in with no maintenance. `status` is optional, so anything
// unknown ranks last rather than crashing or jumping to the top.
const STATUS_RANK: Record<string, number> = {
  Upcoming: 0,
  Ongoing: 1,
  Completed: 2,
};

/** The grid's canonical order: status group, then title A-Z. The endpoint
 *  serves the index in this same order so paging through the fetched list
 *  matches what the server-rendered first page showed. */
export function sortCatalog(items: CatalogItem[]): CatalogItem[] {
  return [...items].sort((a, b) => {
    const rank =
      (STATUS_RANK[a.status ?? ''] ?? 3) - (STATUS_RANK[b.status ?? ''] ?? 3);
    return rank !== 0 ? rank : a.title.localeCompare(b.title);
  });
}

export function escapeHTML(str: string): string {
  if (!str) return '';
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[
        tag
      ] || tag)
  );
}

export function cardHTML(e: CatalogItem): string {
  const epText = epLabel(e.totalEpisodes);
  const bits = [e.type, epText].filter(Boolean).join(' · ');
  const ratingBadge = e.rating
    ? `<span class="rating-badge">★ ${e.rating.toFixed(1)}</span>`
    : '';
  const statusBadge = e.status
    ? `<span class="status-badge status-${e.status.toLowerCase()}">${e.status}</span>`
    : '';

  // Branded fallback when a poster URL dies. The single quotes are part of
  // the value — this lands inside an HTML attribute delimited by double
  // quotes, so this.src='…' has to be built into the string.
  const fallbackImg = `'${POSTER_FALLBACK}'`;

  return `
        <a class="card" href="/anime/${escapeHTML(e.slug)}/">
          <div class="card-poster-wrap">
            <img 
              class="card-poster" 
              src="${escapeHTML(e.poster)}" 
              alt="${escapeHTML(e.title)} cover art" 
              loading="lazy" 
              decoding="async" 
              onerror="this.onerror=null;this.src=${fallbackImg};" 
            />
            ${ratingBadge}
            ${statusBadge}
          </div>
          <div class="card-body">
            <span class="card-slot">${bits}</span>
            <h2 class="card-title">${escapeHTML(e.title)}</h2>
          </div>
        </a>`;
}
