/**
 * The shape of an episode / season / download, shared by two consumers:
 *
 *  1. `src/content.config.ts` — validates the (now optional) inline
 *     `episodes` / `seasons` still allowed in a title's `.md` frontmatter.
 *  2. `src/lib/episode-data.ts` — validates the per-season files
 *     (`<folder>/season-<N>.json`) that hold a title's episode data.
 *
 * Keeping the schema in one module means a sidecar and an inline list are
 * guaranteed to accept exactly the same data — you can migrate a title from
 * one to the other without changing a single field.
 */
import { z } from 'astro/zod';
import { EP_UNKNOWN } from './episodes';

// Download target: either a bare bot CODE (preferred — the username comes
// from src/config.ts, so a bot swap is a one-line change) or a legacy full
// https URL (kept working as-is).
export const downloadTarget = z
  .string()
  .min(1)
  .refine((v) => /^https:\/\//i.test(v) || /^[A-Za-z0-9_-]{6,64}$/.test(v), {
    message: 'Must be a bare CODE or a full https URL',
  });

export const episodeSchema = z.object({
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

export const totalEpCount = z
  .union([z.number(), z.literal(EP_UNKNOWN), z.string().regex(/^\d+\+$/)])
  .optional();

export const seasonSchema = z.object({
  season: z.number(),
  title: z.string().optional(),
  status: z.enum(['Ongoing', 'Completed', 'Upcoming']).optional(),
  totalEpisodes: totalEpCount,
  episodes: z.array(episodeSchema),
});

/**
 * The contents of one per-season file (`<folder>/season-<N>.json`). The season
 * NUMBER is taken from the filename, so it isn't repeated in the file — only
 * the season's own metadata and its episode list live here. A title's seasons
 * are the `season-*.json` files in its folder, sorted by that number.
 */
export const seasonFileSchema = z.object({
  title: z.string().optional(),
  status: z.enum(['Ongoing', 'Completed', 'Upcoming']).optional(),
  totalEpisodes: totalEpCount,
  episodes: z.array(episodeSchema),
});

export type Episode = z.infer<typeof episodeSchema>;
export type Season = z.infer<typeof seasonSchema>;
export type SeasonFile = z.infer<typeof seasonFileSchema>;
