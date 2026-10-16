import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { episodeSchema, seasonSchema, totalEpCount } from './lib/episode-schema';

const httpsUrl = z
  .url()
  .refine((v) => v.startsWith('https://'), { message: 'Only https URLs allowed' });

const anime = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/anime',
    // Each title lives in its own folder (`<slug>/index.md`) so many titles
    // stay navigable. Derive the id from the FOLDER name — not the file path —
    // so a title's URL stays the clean `/anime/<slug>/`. Flat `<slug>.md`
    // files still work (id = the file name), which keeps things correct during
    // any migration between the two layouts.
    generateId: ({ entry }) => {
      const parts = entry.split('/');
      const file = parts.pop(); // e.g. "index.md" or "re-zero.md"
      if (file === 'index.md') return parts.join('/');
      return entry.replace(/\.md$/, '');
    },
  }),
  schema: z.object({
    title: z.string(),
    titleNative: z.string().optional(),
    poster: httpsUrl,
    genres: z.array(z.string()),
    type: z.enum(['Movie', 'Series']),
    year: z.number().optional(),
    status: z.enum(['Ongoing', 'Completed', 'Upcoming']).optional(),
    rating: z.number().min(0).max(10).optional(),
    totalEpisodes: totalEpCount,
    episodes: z.array(episodeSchema).optional(),
    seasons: z.array(seasonSchema).optional(),
    aiAssisted: z.boolean().optional(),
  }),
});

export const collections = {
  anime,
};
