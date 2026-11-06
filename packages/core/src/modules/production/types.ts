import { z } from "zod";

export const ProductionStage = z.enum(["proposal", "reference", "storyboard", "assets", "edit", "render", "qa", "complete"]);
export type ProductionStage = z.infer<typeof ProductionStage>;

export const ProductionStartInput = z.object({
  brief: z.string().trim().min(1).max(4000),
  target: z.string().trim().min(1).max(200),
}).strict();
export type ProductionStartInput = z.infer<typeof ProductionStartInput>;

export const ProductionProposal = z.object({
  concept: z.string().trim().min(1).max(4000),
  durationSeconds: z.number().positive().max(86_400),
  provider: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(200).optional(),
  voice: z.string().trim().max(500).default(""),
  music: z.string().trim().max(500).default(""),
  estimatedCostUsd: z.number().nonnegative().nullable().default(null),
  notes: z.string().trim().max(4000).default(""),
}).strict();
export type ProductionProposal = z.infer<typeof ProductionProposal>;

export const ApprovalInput = z.object({
  note: z.string().trim().max(2000).default(""),
}).strict();
export type ApprovalInput = z.infer<typeof ApprovalInput>;

export const ProductionApproval = ApprovalInput.extend({ actor: z.literal("human"), at: z.number().int().nonnegative() }).strict();
export type ProductionApproval = z.infer<typeof ProductionApproval>;

export const ReferenceEvidence = z.object({
  atSec: z.number().nonnegative(), note: z.string().trim().min(1).max(1000),
}).strict();

export const ReferenceAnalysisInput = z.object({
  mediaId: z.string().min(1),
  hook: z.string().trim().max(2000).default(""),
  structure: z.string().trim().max(4000).default(""),
  pacing: z.string().trim().max(2000).default(""),
  visualLanguage: z.string().trim().max(2000).default(""),
  audioApproach: z.string().trim().max(2000).default(""),
  retain: z.array(z.string().trim().min(1).max(500)).max(100).default([]),
  change: z.array(z.string().trim().min(1).max(500)).max(100).default([]),
  evidence: z.array(ReferenceEvidence).max(200).default([]),
}).strict();
export type ReferenceAnalysisInput = z.infer<typeof ReferenceAnalysisInput>;

export const ReferenceTechnical = z.object({
  durationSec: z.number().nonnegative(), width: z.number().int().nonnegative(), height: z.number().int().nonnegative(),
  fps: z.number().nonnegative(), hasAudio: z.boolean(), videoCodec: z.string().nullable(), audioCodec: z.string().nullable(),
}).strict();

export const ReferenceAnalysis = ReferenceAnalysisInput.extend({ technical: ReferenceTechnical }).strict();
export type ReferenceAnalysis = z.infer<typeof ReferenceAnalysis>;

export const StoryboardScene = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  durationSeconds: z.number().positive().max(3600),
  purpose: z.string().trim().min(1).max(1000),
  visualPrompt: z.string().trim().min(1).max(4000),
  narration: z.string().trim().max(10_000).default(""),
  transition: z.string().trim().max(100).default("cut"),
  referenceAssetIds: z.array(z.string().min(1)).max(20).default([]),
}).strict();
export const Storyboard = z.object({ scenes: z.array(StoryboardScene).min(1).max(500) }).strict();
export type Storyboard = z.infer<typeof Storyboard>;

export const AssetManifestEntry = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  sceneId: z.string().min(1),
  assetId: z.string().min(1),
  provider: z.string().trim().min(1).max(100),
  status: z.enum(["planned", "generating", "ready", "approved", "failed"]),
  costUsd: z.number().nonnegative().nullable().default(null),
  provenance: z.record(z.string(), z.unknown()).default({}),
  note: z.string().trim().max(2000).default(""),
}).strict();
export const AssetManifest = z.object({ assets: z.array(AssetManifestEntry).max(5000) }).strict();
export type AssetManifest = z.infer<typeof AssetManifest>;

export const CheckpointInput = z.object({
  summary: z.string().trim().min(1).max(2000),
  completedSceneIds: z.array(z.string()).max(500).default([]),
  pendingSceneIds: z.array(z.string()).max(500).default([]),
  spendUsd: z.number().nonnegative().default(0),
}).strict();
export const ProductionCheckpoint = CheckpointInput.extend({
  id: z.string(), stage: ProductionStage, at: z.number().int().nonnegative(),
}).strict();
export type ProductionCheckpoint = z.infer<typeof ProductionCheckpoint>;

export const PostRenderQaReport = z.object({
  at: z.number().int().nonnegative(), sequenceId: z.string().nullable(), verdict: z.enum(["passed", "failed"]),
  findings: z.array(z.object({ severity: z.enum(["critical", "warning", "info"]), message: z.string() }).strict()),
  outputs: z.array(z.record(z.string(), z.unknown())).default([]),
}).strict();
export type PostRenderQaReport = z.infer<typeof PostRenderQaReport>;

export const ProductionRun = z.object({
  projectId: z.string(), revision: z.number().int().positive(), brief: z.string(), target: z.string(), stage: ProductionStage,
  approvals: z.object({ proposal: ProductionApproval.nullable(), assets: ProductionApproval.nullable() }).strict(),
  artifacts: z.object({
    proposal: ProductionProposal.nullable(), reference: ReferenceAnalysis.nullable(), storyboard: Storyboard.nullable(),
    assets: AssetManifest.nullable(), qa: PostRenderQaReport.nullable(),
  }).strict(),
  checkpoints: z.array(ProductionCheckpoint), createdAt: z.number().int().nonnegative(), updatedAt: z.number().int().nonnegative(),
}).strict();
export type ProductionRun = z.infer<typeof ProductionRun>;
