# Night Guide — Anime Catalog

A free, statically-hosted catalog site built with [Astro](https://astro.build)
and deployed via GitHub Pages. Shows cover art, title, genres, and a
synopsis for each entry.

**This site is informational only.** The content schema has no
`episodes` or `link` fields — there's nowhere in this template to add a
video/streaming link, by design.

## Project structure

```
src/
  content/
    config.ts          ← the schema (title, poster, genres, type, year, status)
    anime/
      example-series-one.md
      example-movie-one.md
  layouts/
    Base.astro          ← shared page shell + design system
  pages/
    index.astro          ← catalog grid
    anime/[...slug].astro ← individual entry page
  styles/
    global.css           ← design tokens & styling
.github/workflows/deploy.yml  ← auto-deploys to GitHub Pages on push to main
```

## Adding a title

Create a new `.md` file in `src/content/anime/`, e.g. `src/content/anime/my-title.md`:

```markdown
---
title: "Your Title Here"
titleNative: "オリジナルタイトル"   # optional
poster: "https://example.com/poster.jpg"
genres: ["Action", "Drama"]
type: "Series"                       # "Movie" or "Series"
year: 2024                            # optional
status: "Airing"                      # optional: Airing / Completed / Upcoming
---

Your synopsis goes here, in whatever language you like — this is a
regular Markdown body, so you can use paragraphs, **bold**, etc.
```

The filename (minus `.md`) becomes the page's URL slug, e.g.
`src/content/anime/my-title.md` → `/anime/my-title/`.

## Running it locally

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:4321`).

## Deploying to GitHub Pages (free)

1. Push this project to a new GitHub repository.
2. In the repo, go to **Settings → Pages**, and under "Build and
   deployment", set **Source** to **GitHub Actions**.
3. If your repo is `github.com/<user>/<repo>` (not a `<user>.github.io`
   repo), open `astro.config.mjs` and uncomment/set:
   ```js
   site: 'https://<user>.github.io',
   base: '/<repo>',
   ```
   This makes internal links resolve correctly under the repo subpath.
   Skip this step entirely if your repo is named `<user>.github.io`.
4. Commit and push to `main` — the included workflow
   (`.github/workflows/deploy.yml`) builds and deploys automatically.
   You can also trigger it manually from the Actions tab
   (`workflow_dispatch`).
5. Your site will be live at `https://<user>.github.io/<repo>/` (or
   `https://<user>.github.io/` for a `<user>.github.io` repo) within a
   minute or two of the workflow finishing.

## Notes on posters

The example entries use placeholder images from `picsum.photos` so the
site builds and previews correctly out of the box. Swap in your own
poster URLs — official promotional stills, art you have rights to use,
or your own artwork are all reasonable choices; just be mindful that
poster art itself can be copyrighted too.
