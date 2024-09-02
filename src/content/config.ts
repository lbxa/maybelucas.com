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

const aboutCollection = defineCollection({
  type: "content"
})

export const collections = {
  'blog': blogCollection,
  'about': aboutCollection
};