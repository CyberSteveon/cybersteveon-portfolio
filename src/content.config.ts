import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().max(240),
    technologies: z.array(z.string()).min(1),
    status: z.enum(["Completed", "Active Development", "Planned"]),
    category: z.string(),
    repository: z.url().optional(),
    demo: z.url().optional(),
    featured: z.boolean().default(false),
    order: z.number(),
    visual: z.enum(["database", "network", "terminal", "code"]),
    image: z.object({ src: z.string(), alt: z.string().min(1) }).optional(),
    architecture: z
      .object({ src: z.string(), alt: z.string().min(1) })
      .optional(),
  }),
});
export const collections = { projects };
