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
export const SITE_URL = 'https://anixsubs.online';

/**
 * Google Search Console ownership token, rendered as a meta tag in the head
 * of every page. Google only checks the home page, but rendering it
 * site-wide costs nothing and means the tag cannot be lost to a page-level
 * change.
 *
 * Per Google's own instruction this must stay up permanently — removing it
 * does not immediately un-verify the property, but it makes a future
 * re-verification need a code change and a deploy. To replace the token
 * after moving Search Console accounts: change this ONE line.
 */
export const GOOGLE_SITE_VERIFICATION =
  '3q-WZVqYo0iPltgxUp9w4PBnt_fNajexoVTfSRrqZA0';

/**
 * Branded stand-in shown when a poster URL fails to load. Posters are
 * i.pinimg.com links, which get taken down more often than you would hope —
 * and when one dies the failure is silent, so it is only noticed by whoever
 * happens to open that detail page.
 *
 * Both render sites must fall back: the catalog card AND the detail poster.
 * The card had this and the detail page did not, so a dead URL left a
 * broken 260×390 image box on the detail page while the catalog still
 * looked healthy — the one combination that hides the problem.
 *
 * Shared from here so the two cannot drift apart into different paths.
 */
export const POSTER_FALLBACK = '/images/aniXsubs-no-photo-placeholder-v2.png';

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
  text: 'Welcome to aniXsubs! Enjoy quality Myanmar-subtitled anime, new episode updates, and easy access through our website and Telegram bot.',
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
