import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    author: z.string(),
    description: z.string().optional(),
    date: z.date()
  })
});

const aboutCollection = defineCollection({
  type: "content"
});

const researchCollection = defineCollection({
  type: "content",
});

const questionsCollection = defineCollection({
  type: "content",
});

const bookshelfCollection = defineCollection({
  type: "content",
});

export const collections = {
  'blog': blogCollection,
  'about': aboutCollection,
  'research': researchCollection,
  'questions': questionsCollection,
  'bookshelf': bookshelfCollection,
};