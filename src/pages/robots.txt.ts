import type { APIRoute } from 'astro';
import { SITE_URL } from '../config';

/**
 * Was a 404. Nothing was blocking crawlers, but a missing robots.txt leaves
 * discovery entirely to chance and gives nowhere to advertise the sitemap.
 *
 * Deliberately permissive: every page on this site is meant to be read, and
 * the ?type= / search parameter URLs are already handled — the canonical
 * tag on each page points at the clean path, so robots.txt never has to
 * play whack-a-mole with filter combinations.
 *
 * An endpoint rather than a file in public/ so it reads SITE_URL: swapping
 * to the custom domain moves this line with everything else, instead of
 * leaving a stale origin in the one file crawlers read first.
 */
export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      '',
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
