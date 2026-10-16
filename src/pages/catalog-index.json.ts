/**
 * The catalog index as a separate JSON file rather than inline in the home
 * page's HTML: the home payload stays bounded (only the first page of cards
 * ships in the HTML) no matter how many titles exist, and the browser fetches
 * this lazily — only for deep-linked filters, paging past the rendered cards,
 * or the first search/filter interaction. See loadCatalog and the init block
 * in index.astro.
 *
 * Items come pre-sorted in grid order, so paging the fetched list matches the
 * server-rendered first page. zz-sample-* fixtures are excluded in production
 * by loadCatalog (they exist only under `astro dev`).
 */
import type { APIRoute } from 'astro';
import { loadCatalog } from '../lib/catalog-server';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await loadCatalog()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
