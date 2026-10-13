import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_URL } from '../config';

/**
 * Was a 404 — Google had no list of URLs and nothing but link-following to
 * find the catalog with. Built as an endpoint so the anime entries come from
 * the same content collection the detail routes do: a title added tomorrow
 * lands in the sitemap on its own, no file to remember to edit.
 */

// Same four static pages Base.astro's nav points at. Movies/Series are
// deliberately absent — they are ?type= filters on /, not pages of their
// own, and listing them here would advertise URLs whose canonical points
// somewhere else.
const STATIC_PATHS = ['/', '/about', '/guide', '/terms'];

// Identical to getStaticPaths in anime/[...slug].astro: zz-sample-* are
// local layout fixtures, built in dev only. Mirroring the filter keeps the
// sitemap from advertising routes that do not exist in production.
const isBuilt = (id: string) => import.meta.env.DEV || !id.startsWith('zz-sample-');

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async () => {
  const entries = (await getCollection('anime')).filter((e) => isBuilt(e.id));

  // No trailing slash on anything but the root, matching both the nav's
  // hrefs and the canonical tags these URLs carry.
  const paths = [...STATIC_PATHS, ...entries.map((e) => `/anime/${e.id}`)];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map(
      (p) => `  <url><loc>${esc(`${SITE_URL}${p}`)}</loc></url>`
    ),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
