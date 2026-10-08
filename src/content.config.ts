import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const httpsUrl = z
  .url()
  .refine((v) => v.startsWith('https://'), { message: 'Only https URLs allowed' });

// Download target: either a bare bot CODE (preferred — the username comes
// from src/config.ts, so a bot swap is a one-line change) or a legacy full
// https URL (kept working as-is).
const downloadTarget = z
  .string()
  .min(1)
  .refine((v) => /^https:\/\//i.test(v) || /^[A-Za-z0-9_-]{6,64}$/.test(v), {
    message: 'Must be a bare CODE or a full https URL',
  });

const episodeSchema = z.object({
  ep: z.number(),
  title: z.string().optional(),
  downloads: z.array(
    z.object({
      source: z.string(),
      format: z.enum(['mkv', 'mp4']),
      quality: z.string(),
      size: z.string(),
      link: downloadTarget,
    })
  ),
});

const totalEpCount = z
  .union([z.number(), z.literal('Unknown'), z.string().regex(/^\d+\+$/)])
  .optional();

const seasonSchema = z.object({
  season: z.number(),
  title: z.string().optional(),
  status: z.enum(['Ongoing', 'Completed', 'Upcoming']).optional(),
  totalEpisodes: totalEpCount,
  episodes: z.array(episodeSchema),
});

const anime = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/anime' }),
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
