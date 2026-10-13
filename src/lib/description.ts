/**
 * Meta description built from a content entry's markdown body.
 *
 * Before this, all three detail pages shipped the identical site-wide
 * tagline as their meta description — so a search for any of the three
 * titles returned the same three words, none of them the title. The real
 * description already existed: the Burmese synopsis sitting in the body of
 * every content file, loaded at build time anyway.
 *
 * The output deliberately stays Burmese. That is what these pages are
 * indexed for: someone searching for the title is searching in Burmese, and
 * the synopsis you already chose to publish is the honest summary. It flows
 * into og:description too, so link previews render Burmese — intentional,
 * not an oversight.
 */

/** ~150 code units. Burmese renders noticeably wider than Latin at the
 *  same count, so this errs short of the ~155 that suits English. */
export const SYNOPSIS_MAX = 150;

/**
 * Markdown/HTML → one plain line, cut to `max`.
 * Returns '' when there is nothing usable, so callers can fall back to the
 * site-wide default rather than emit an empty meta tag.
 */
export function synopsisDescription(
  body: string | undefined,
  max: number = SYNOPSIS_MAX
): string {
  if (!body) return '';

  const text = body
    // FIRST: black-clover's body ends with a `<!-- Sources: anilist.co … -->`
    // sourcing note. Strip it before anything else — otherwise that comment
    // lands verbatim in a Google snippet, which would be both useless and
    // an unrequested citation.
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Markdown images and links keep their visible text, drop the target.
    // None exist in the bodies today; stripped anyway so a future one does
    // not render as literal `](https://…)` in a search result.
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Headings, emphasis, quotes, inline code — same reasoning.
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/^\s*>\s?/gm, '')
    .replace(/`([^`]*)`/g, '$1')
    // Paragraphs become one continuous line — a meta description has nowhere
    // to put a newline, and literal newlines collapse to spaces anyway.
    .replace(/\s+/g, ' ')
    .trim();

  return truncateAtWord(text, max);
}

/**
 * Cut to `max` on a whitespace boundary.
 *
 * A raw `text.slice(0, max)` is unsafe on this text. Burmese composes
 * syllables from separate code points — stacked consonants, virama, vowel
 * signs — so a slice can land between a base character and the marks that
 * belong to it and print a broken syllable. Nowhere is a broken glyph more
 * visible than in the one-line snippet under a search result. Whitespace
 * never falls inside a cluster, so cutting there cannot do it.
 */
function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;

  const window = text.slice(0, max + 1); // +1 so a space exactly at `max` still counts
  const space = window.lastIndexOf(' ');
  if (space > 0) return window.slice(0, space).trimEnd() + '…';

  // Prose with no space in 150 characters should not exist, but if it ever
  // does, fall back to grapheme boundaries rather than a raw slice — the
  // cluster guarantee has to hold on the fallback path too.
  return graphemeSlice(text, max) + '…';
}

/** Segmenter is typed against a lib this project does not ship, so it is
 *  reached through a narrow structural type instead of `any`. */
type SegmentResult = { segment: string };
type SegmenterLike = { segment(input: string): Iterable<SegmentResult> };
type SegmenterCtor = new (locale?: string[], options?: unknown) => SegmenterLike;

function graphemeSlice(text: string, max: number): string {
  const Ctor = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;
  if (!Ctor) return text.slice(0, max);

  const seg = new Ctor(undefined, { granularity: 'grapheme' });
  let out = '';
  let count = 0;
  for (const { segment } of seg.segment(text)) {
    if (count >= max) break;
    out += segment;
    count += 1;
  }
  return out;
}
