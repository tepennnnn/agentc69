import { z } from "zod";

export const TransitionPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  bin: z.string(),
  category: z.string(),
  effectType: z.string().default("transform"),
  kind: z.enum(["zoom", "glitch", "wiggle", "offset", "stretch", "dissolve", "dip", "wipe", "slide"]).default("zoom"),
  durationSec: z.number().positive().default(0.5),
  description: z.string().optional(),
});

export type TransitionPreset = z.infer<typeof TransitionPresetSchema>;

export const TransitionImportResultSchema = z.object({
  totalImported: z.number(),
  bins: z.array(z.string()),
  presets: z.array(TransitionPresetSchema),
});

export type TransitionImportResult = z.infer<typeof TransitionImportResultSchema>;
