import { z } from "zod";

export const ImageAspectRatio = z.enum(["16:9", "9:16", "1:1", "4:3", "3:4"]);
export type ImageAspectRatio = z.infer<typeof ImageAspectRatio>;

export const ImageGenerationRequest = z.object({
  prompt: z.string().min(1).max(4000),
  negativePrompt: z.string().max(2000).optional(),
  aspectRatio: ImageAspectRatio.default("16:9"),
  variantsCount: z.number().int().min(1).max(4).default(1),
  model: z.string().max(200).optional(),
  stylePresetId: z.string().optional(),
  referenceAssetIds: z.array(z.string()).default([]),
  isNsfw: z.boolean().default(false),
  seed: z.number().int().optional(),
});
export type ImageGenerationRequest = z.infer<typeof ImageGenerationRequest>;

export const GeneratedImageVariant = z.object({
  id: z.string(),
  assetId: z.string().nullable(),
  url: z.string(),
  prompt: z.string(),
  aspectRatio: ImageAspectRatio,
  seed: z.number().nullable(),
  createdAt: z.number(),
});
export type GeneratedImageVariant = z.infer<typeof GeneratedImageVariant>;

export const ImageGenerationJob = z.object({
  id: z.string(),
  projectId: z.string(),
  prompt: z.string(),
  status: z.enum(["queued", "generating", "ready", "failed", "cancelled"]),
  variants: z.array(GeneratedImageVariant),
  progress: z.number().min(0).max(1),
  stage: z.string(),
  error: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type ImageGenerationJob = z.infer<typeof ImageGenerationJob>;

export const StoryboardScene = z.object({
  sceneNumber: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  prompt: z.string(),
  cameraAngle: z.string().optional(),
  lighting: z.string().optional(),
  status: z.enum(["pending", "generating", "ready", "failed"]).default("pending"),
  assetId: z.string().nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  error: z.string().nullable().default(null),
});
export type StoryboardScene = z.infer<typeof StoryboardScene>;

export const StoryboardGenerationRequest = z.object({
  storyline: z.string().min(1).max(10000),
  sceneCount: z.number().int().min(1).max(12).optional(),
  stylePresetId: z.string().optional(),
  aspectRatio: ImageAspectRatio.default("16:9"),
  model: z.string().optional(),
  characterConsistency: z.boolean().default(true),
  isNsfw: z.boolean().default(false),
});
export type StoryboardGenerationRequest = z.infer<typeof StoryboardGenerationRequest>;

export const StoryboardJob = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  storyline: z.string(),
  scenes: z.array(StoryboardScene),
  status: z.enum(["decomposed", "generating", "ready", "partial", "failed"]),
  progress: z.number().min(0).max(1),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type StoryboardJob = z.infer<typeof StoryboardJob>;
