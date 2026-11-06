import { z } from "zod";

export const EnergyLevel = z.enum(["subtle", "balanced", "viral-hook"]).default("viral-hook");
export type EnergyLevel = z.infer<typeof EnergyLevel>;

export const ImageInspectRequest = z.object({
  assetId: z.string().optional(),
  imagePath: z.string().optional(),
  base64: z.string().optional(),
  target: z.string().default("google-veo"),
  energy: EnergyLevel.optional().default("viral-hook"),
  customTemplate: z.string().optional(),
  harness: z.string().optional(),
  model: z.string().optional(),
}).strict();
export type ImageInspectRequest = z.infer<typeof ImageInspectRequest>;

export const ImageInspectResult = z.object({
  target: z.string(),
  energy: EnergyLevel,
  imageDescription: z.string(),
  positivePrompt: z.string(),
  negativePrompt: z.string(),
  raw: z.string(),
}).strict();
export type ImageInspectResult = z.infer<typeof ImageInspectResult>;
