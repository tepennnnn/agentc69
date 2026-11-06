import { z } from "zod";

export const VideoGenerationRequest = z.object({
  prompt: z.string().trim().min(1).max(4000),
  provider: z.literal("n8n").default("n8n"),
  model: z.string().trim().min(1).max(200).optional(),
  mode: z.enum(["text-to-video", "image-to-video", "reference-to-video"]).default("text-to-video"),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  durationSeconds: z.number().int().min(1).max(60).default(4),
  referenceAssetIds: z.array(z.string().min(1)).max(20).default([]),
  startFrameAssetId: z.string().min(1).optional(),
  endFrameAssetId: z.string().min(1).optional(),
  sourceVideoAssetId: z.string().min(1).optional(),
  seed: z.number().int().nonnegative().max(2_147_483_647).optional(),
  resolution: z.string().trim().min(1).max(50).optional(),
  fps: z.number().int().min(1).max(120).optional(),
  generateAudio: z.boolean().optional(),
  negativePrompt: z.string().trim().max(2000).optional(),
  enhancePrompt: z.boolean().default(true),
  estimateOnly: z.boolean().default(false),
  sequenceId: z.string().min(1).optional(),
  placeAt: z.number().nonnegative().nullable().optional(),
  layer: z.number().int().nonnegative().optional(),
  autoPlace: z.boolean().default(false),
}).strict();

export type VideoGenerationRequest = z.infer<typeof VideoGenerationRequest>;

export const VideoGenerationStatus = z.enum([
  "submitting", "queued", "generating", "downloading", "importing", "ready", "failed", "cancelled",
]);
export type VideoGenerationStatus = z.infer<typeof VideoGenerationStatus>;

export type VideoGenerationProvenance = {
  provider: "n8n";
  model: string | null;
  mode: VideoGenerationRequest["mode"];
  originalPrompt: string;
  enhancedPrompt: string;
  inputAssetIds: string[];
  seed: number | null;
  remoteJobId: string | null;
};

export type VideoGenerationEstimate = {
  estimateOnly: true;
  provider: "n8n";
  model: string | null;
  prompt: string;
  estimatedCostUsd: number | null;
  request: VideoGenerationRequest;
  provenance: VideoGenerationProvenance;
};

export type VideoGeneration = {
  id: string;
  projectId: string;
  provider: "n8n";
  model: string | null;
  request: VideoGenerationRequest;
  remoteId: string | null;
  status: VideoGenerationStatus;
  progress: number;
  stage: string;
  error: string | null;
  outputMediaId: string | null;
  estimatedCostUsd: number | null;
  actualCostUsd: number | null;
  outputSha256: string | null;
  provenance: VideoGenerationProvenance;
  createdAt: number;
  updatedAt: number;
};

export type VideoGenerationConfig = {
  submitUrl: string;
  statusUrl: string;
  cancelUrl: string;
  outputHosts: string;
  tokenSet: boolean;
  configured: boolean;
  sources: {
    submitUrl: "workspace" | "environment" | "none";
    statusUrl: "workspace" | "environment" | "none";
    cancelUrl: "workspace" | "environment" | "none";
    outputHosts: "workspace" | "environment" | "none";
    token: "workspace" | "environment" | "none";
  };
};
