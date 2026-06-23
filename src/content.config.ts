import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogCollection = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    description: z.string(),
    date: z.coerce.date(),
  }),
});

const aboutCollection = defineCollection({
  loader: glob({ base: './src/content/about', pattern: '**/*.{md,mdx}' }),
});

const researchCollection = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/*.{md,mdx}' }),
});

const questionsCollection = defineCollection({
  loader: glob({ base: './src/content/questions', pattern: '**/*.{md,mdx}' }),
});

const bookshelfCollection = defineCollection({
  loader: glob({ base: './src/content/bookshelf', pattern: '**/*.{md,mdx}' }),
});

const codingCollection = defineCollection({
  loader: glob({ base: './src/content/coding', pattern: '**/*.{md,mdx}' }),
});

export const collections = {
  blog: blogCollection,
  about: aboutCollection,
  research: researchCollection,
  questions: questionsCollection,
  bookshelf: bookshelfCollection,
  coding: codingCollection,
};
