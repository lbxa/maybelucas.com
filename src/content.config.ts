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

const problemsCollection = defineCollection({
  loader: glob({
    base: './src/content/problems',
    pattern: '**/[^_]*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    source: z.string().url(),
    topic: z.string(),
    difficulty: z.number().int().min(1).max(10),
    estimatedTime: z.number().int().positive(),
  }),
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
  problems: problemsCollection,
  bookshelf: bookshelfCollection,
  coding: codingCollection,
};
