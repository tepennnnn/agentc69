import { z } from "zod";

export const WordTiming = z.object({
  word: z.string().trim(),
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
}).strict();
export type WordTiming = z.infer<typeof WordTiming>;

export const CaptionPage = z.object({
  id: z.string(),
  text: z.string(),
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
  words: z.array(WordTiming),
}).strict();
export type CaptionPage = z.infer<typeof CaptionPage>;

export const CaptionStylePreset = z.enum(["bounce", "karaoke", "neon", "typewriter"]).default("bounce");
export type CaptionStylePreset = z.infer<typeof CaptionStylePreset>;

export const CaptionTrack = z.object({
  id: z.string(),
  style: CaptionStylePreset,
  pages: z.array(CaptionPage),
  fontSize: z.number().positive().default(48),
  primaryColor: z.string().default("#ffffff"),
  accentColor: z.string().default("#facc15"), // Yellow highlight
  positionY: z.number().min(0).max(100).default(80), // % from top
}).strict();
export type CaptionTrack = z.infer<typeof CaptionTrack>;

export interface PaginationOptions {
  maxCharsPerPage?: number;
  maxWordsPerPage?: number;
  pauseThresholdMs?: number;
}
