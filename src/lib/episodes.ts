/**
 * The catalog card, the detail-page poster badge and the season strip all
 * label an episode count. They used to each re-implement that rule and had
 * already drifted: the card printed "Unknown" bare, the detail page hid it
 * entirely, and neither suffixed "170+". One function owns it now.
 *
 * The schema (`totalEpCount` in content.config.ts) permits three shapes —
 * a real number, a "170+"-style floor, and EP_UNKNOWN — so every value
 * carries the unit rather than only the ones that happen to be numeric.
 */

/** Shown when a title's episode count isn't known. Replaces the old word
 *  "Unknown", which was seven characters and burst the badge wide next to
 *  the compact "Series ·" prefix. */
export const EP_UNKNOWN = '???';

/** How many episodes one generated page carries.
 *
 *  Episodes used to all ship in one HTML file and get paged client-side; they
 *  now live behind real routes (`/anime/<id>/`, `/anime/<id>/2/`, …) so a long
 *  season never bloats a single page. 10 matches the rhythm the pager already
 *  had, and keeps every page small on a phone. Tunable — bump it and the route
 *  count drops with no other change. */
export const EP_PAGE_SIZE = 10;

type EpisodeCount = number | string | null | undefined;

/** 12 → "12 EP" · 170 → "170 EP" · "170+" → "170+ EP" · "???" → "??? EP".
 *  Returns null when there's no count at all, so callers can filter it out. */
export function epLabel(count: EpisodeCount): string | null {
  if (count === null || count === undefined || count === '') return null;
  return `${count} EP`;
}
