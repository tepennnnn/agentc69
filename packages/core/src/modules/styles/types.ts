import { z } from "zod";

export const StylePreset = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  desc: z.string(),
  tags: z.array(z.string()),
  prompt: z.string(),
  best: z.array(z.string()),
  isNsfw: z.boolean().default(false),
}).strict();
export type StylePreset = z.infer<typeof StylePreset>;

export const StyleQueryOptions = z.object({
  category: z.string().optional(),
  includeNsfw: z.boolean().default(false),
  search: z.string().optional(),
}).strict();
export type StyleQueryOptions = z.infer<typeof StyleQueryOptions>;
