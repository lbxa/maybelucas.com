// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    author: z.string(),
    description: z.string(),
    date: z.date()
  })
});

export const collections = {
  'blog': blogCollection,
};