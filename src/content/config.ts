import { z, defineCollection } from 'astro:content';

const animeCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    titleNative: z.string().optional(),
    poster: z.string(),
    genres: z.array(z.string()),
    type: z.enum(['Movie', 'Series']),
    year: z.number().optional(),
    status: z.enum(['Ongoing', 'Completed', 'Upcoming']).optional(),
    rating: z.number().min(0).max(10).optional(),
    totalEpisodes: z.union([z.number(), z.string()]).optional(),
    episodes: z.array(
      z.object({
        ep: z.number(),
        title: z.string().optional(),
        downloads: z.array(
          z.object({
            source: z.string(),
            format: z.enum(['mkv', 'mp4']),
            quality: z.string(),
            size: z.string(),
            link: z.string().url()
          })
        ),
      })
    ).optional(),
  }),
});

export const collections = {
  anime: animeCollection,
};