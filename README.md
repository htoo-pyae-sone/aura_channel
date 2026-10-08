# aniXsubs — Anime Catalog

A statically-hosted catalog site built with [Astro](https://astro.build)
and deployed on Vercel. Shows cover art, title, genres, rating, and a
synopsis for each entry, plus per-episode download links.

## Project structure

```
src/
  content.config.ts    ← collection + schema (title, poster, genres, type, year, status, rating, totalEpisodes, episodes)
  content/
    anime/
      smoking-behind-the-supermarket-with-you.md
      love-unseen-beneath-the-clear-night-sky.md
  components/
    SwipeNav.astro     ← about/terms pager
  layouts/
    Base.astro         ← shared page shell + design system
  pages/
    index.astro        ← catalog grid + search/filter
    anime/[...slug].astro ← individual entry + episodes/downloads
    about.astro / guide.astro / terms.astro
  styles/
    global.css         ← design tokens & styling
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
status: "Ongoing"                     # optional: Ongoing / Completed / Upcoming
rating: 8.5                           # optional, 0-10
aiAssisted: true                      # optional: shows the AI credit line
totalEpisodes: 24                     # number, "Unknown", or "170+" (only these)
episodes:                             # optional: single-season list
  - ep: 1
    title: "Episode title"             # optional
    downloads:
      - source: "Bot"
        format: "mp4"                 # "mkv" or "mp4"
        quality: "1080p"
        size: "243 MB"
        link: "abc123XYZ"              # bare bot CODE (username lives in src/config.ts)
seasons:                              # optional: use INSTEAD of episodes for S1/S2/…
  - season: 1
    title: "Season 1"                 # optional label
    status: "Completed"               # optional per-season status
    totalEpisodes: 24                 # number, or "Unknown"
    episodes:
      - ep: 1
        downloads:
          - source: "Bot"
            format: "mp4"
            quality: "1080p"
            size: "243 MB"
            link: "abc123XYZ"
  - season: 2
    status: "Ongoing"
    episodes:
      - ep: 1
        downloads:
          - source: "Bot"
            format: "mp4"
            quality: "1080p"
            size: "200 MB"
            link: "xyz789ABC"
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

## Deploying to Vercel

1. Push to GitHub (`main` branch).
2. Vercel Dashboard → Add New → Import this repo. Framework preset: `Astro`,
   Build command: `astro build`, Output: `dist`.
3. Every push to `main` redeploys automatically. No `site`/`base` config needed —
   the app uses root-absolute URLs (`/anime/...`, `/images/...`).

## Notes on posters

The example entries use placeholder images from `picsum.photos` so the
site builds and previews correctly out of the box. Swap in your own
poster URLs — official promotional stills, art you have rights to use,
or your own artwork are all reasonable choices; just be mindful that
poster art itself can be copyrighted too.
