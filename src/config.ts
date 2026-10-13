// Single source of truth for the Telegram bot username baked into
// download buttons. On bot swap: change this ONE line and redeploy.
// Content files store only the CODE (or a full https URL for legacy rows).
export const BOT_USERNAME = 'anixsubsbot';

/**
 * Canonical origin, no trailing slash. Every absolute URL the build emits is
 * derived from this — canonical, og:url, og:image, twitter:image, the
 * sitemap and robots.txt's sitemap line — so when the custom domain lands,
 * change THIS one line (plus Vercel's domain settings) and every one of
 * them moves together. They were all relative or absent before, which meant
 * link previews dropped the image and the two URL forms both indexed.
 *
 * Deliberately no trailing slash: the site links to itself without one
 * (`/about` in the nav), and a canonical has to match the form its own
 * internal links point at or the two signals fight each other.
 */
export const SITE_URL = 'https://anixsubs.vercel.app';

export function downloadUrl(link: string): string {
  if (/^https?:\/\//i.test(link)) return link; // legacy full URL, use as-is
  return `https://t.me/${BOT_USERNAME}?start=${link}`;
}

/**
 * Front-page announcement bar — sits directly under the header, above the
 * filter panel, and hides itself whenever the panel is open or the filter
 * chip row is showing (so the results keep the top of the page once you're
 * filtering).
 *
 * To announce something: edit `text` and redeploy. To take it down: set the
 * whole value to `null`. Catalog page only.
 *
 * `until` is an ISO date (YYYY-MM-DD). On or after it the bar removes itself
 * — checked in the browser, not at build time, so it expires on schedule
 * even if nothing is rebuilt. Leave it off for a permanent notice.
 */
export const ANNOUNCEMENT: { text: string; until?: string } | null = {
  // Permanent welcome — no `until`, so it stays up until this is edited.
  text: 'Welcome! Stream MMSub anime in the best quality at full speed',
};

/**
 * Social links, shown as icons on the right of the footer's top row. Either
 * may be left off — the icon renders only when its URL is filled in, so an
 * empty object means no icons rather than a dead link. They open in a new
 * tab, like any outbound link should.
 */
export const SOCIAL: { telegram?: string; facebook?: string } = {
  // Real profile URLs. Delete a line to drop that icon entirely (an empty
  // object means no icons, never a dead link).
  telegram: 'https://t.me/anixsubs',
  facebook: 'https://www.facebook.com/aniXsubs',
};
