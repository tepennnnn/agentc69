import { z } from "zod";
import type { AssetRow } from "../../common/server/db";

export const VoiceoverSettings = z.object({
  pythonPath: z.string().trim().min(1),
  modelDir: z.string().trim().min(1),
  model: z.enum(["nano", "turbo"]).default("nano"),
  device: z.enum(["auto", "cpu", "cuda"]).default("auto"),
  threads: z.number().int().min(1).max(4).default(2),
}).strict();
export type VoiceoverSettings = z.infer<typeof VoiceoverSettings>;

export const VoiceoverInput = z.object({
  text: z.string().trim().min(1).max(10_000),
  name: z.string().trim().min(1).max(160).optional(),
  referenceAssetId: z.string().min(1).max(100).optional(),
}).strict();
export type VoiceoverInput = z.infer<typeof VoiceoverInput>;

export const VoiceoverCloneInput = VoiceoverInput.extend({ referenceAssetId: z.string().min(1).max(100) }).strict();
export type VoiceoverCloneInput = z.infer<typeof VoiceoverCloneInput>;

export const VoiceoverRuntime = z.object({
  version: z.string(), torch: z.string(), perth: z.string(),
  cudaAvailable: z.boolean(), gpu: z.string().nullable(), python: z.string(),
}).strict();
export type VoiceoverRuntime = z.infer<typeof VoiceoverRuntime>;
export const VoiceoverFingerprint = z.object({ file: z.string(), size: z.number(), mtimeMs: z.number() }).strict();
export type VoiceoverFingerprint = z.infer<typeof VoiceoverFingerprint>;
export const VoiceoverConfiguration = z.object({
  version: z.literal(1), settings: VoiceoverSettings, runtime: VoiceoverRuntime,
  fingerprints: z.array(VoiceoverFingerprint),
}).strict();
export type VoiceoverConfiguration = z.infer<typeof VoiceoverConfiguration>;
export type VoiceoverStatus = {
  ready: boolean;
  message: string;
  settings: VoiceoverSettings;
  runtime?: VoiceoverRuntime;
};
export type VoiceoverResult = {
  asset: AssetRow;
  engine: "chatterbox";
  durationSec: number;
  provenance: { engine: "chatterbox"; model: VoiceoverSettings["model"]; referenceAssetId: string | null; offline: true };
};
export type VoiceoverWorkerRequest = {
  action: "probe" | "generate";
  modelDir?: string;
  model?: VoiceoverSettings["model"];
  device?: VoiceoverSettings["device"];
  threads?: number;
  outputDir?: string;
  referencePath?: string | null;
  chunks?: Array<{ text: string }>;
};
export type VoiceoverWorkerInvoker = (pythonPath: string, request: VoiceoverWorkerRequest, dir: string) => Promise<unknown>;
