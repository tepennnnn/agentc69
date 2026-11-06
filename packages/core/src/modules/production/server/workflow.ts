import { randomUUID } from "node:crypto";
import { db, q } from "../../../common/server/db";
import { readEditor } from "../../editor/server/store";
import { probe } from "../../media/server/ffmpeg";
import {
  ApprovalInput, AssetManifest, CheckpointInput, ProductionProposal, ProductionRun, ProductionStartInput,
  ReferenceAnalysisInput, Storyboard, type PostRenderQaReport, type ProductionApproval, type ProductionRun as ProductionRunType,
} from "../types";

db.exec(`CREATE TABLE IF NOT EXISTS production_runs (
  project_id TEXT PRIMARY KEY REFERENCES projects(id),
  revision INTEGER NOT NULL,
  state_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
)`);

type Row = { project_id: string; revision: number; state_json: string; updated_at: number };

export class ProductionRevisionConflict extends Error {
  constructor(public current: ProductionRunType) { super("This production changed elsewhere. Review the latest version before saving."); }
}

function row(projectId: string): Row | undefined {
  return db.prepare("SELECT * FROM production_runs WHERE project_id = ?").get(projectId) as Row | undefined;
}

function parse(found: Row): ProductionRunType {
  return ProductionRun.parse({ ...JSON.parse(found.state_json), revision: found.revision, updatedAt: found.updated_at });
}

export function readProduction(projectId: string): ProductionRunType | null {
  const found = row(projectId);
  return found ? parse(found) : null;
}

export function startProduction(projectId: string, given: unknown): ProductionRunType {
  if (!q.getProject(projectId)) throw new Error("Project not found");
  if (row(projectId)) throw new Error("This project already has a production run. Resume it instead.");
  const input = ProductionStartInput.parse(given);
  const now = Date.now();
  const run = ProductionRun.parse({
    projectId, revision: 1, brief: input.brief, target: input.target, stage: "proposal",
    approvals: { proposal: null, assets: null },
    artifacts: { proposal: null, reference: null, storyboard: null, assets: null, qa: null },
    checkpoints: [], createdAt: now, updatedAt: now,
  });
  db.prepare("INSERT INTO production_runs(project_id, revision, state_json, updated_at) VALUES (?, 1, ?, ?)")
    .run(projectId, JSON.stringify(run), now);
  return readProduction(projectId)!;
}

function mutate(projectId: string, expectedRevision: number, change: (run: ProductionRunType) => ProductionRunType): ProductionRunType {
  db.exec("BEGIN IMMEDIATE");
  try {
    const found = row(projectId);
    if (!found) throw new Error("Start a production run first.");
    const current = parse(found);
    if (current.revision !== expectedRevision) throw new ProductionRevisionConflict(current);
    const now = Date.now();
    const next = ProductionRun.parse({ ...change(structuredClone(current)), revision: current.revision + 1, updatedAt: now });
    db.prepare("UPDATE production_runs SET revision = ?, state_json = ?, updated_at = ? WHERE project_id = ?")
      .run(next.revision, JSON.stringify(next), now, projectId);
    db.exec("COMMIT");
    return readProduction(projectId)!;
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch { /* no transaction */ }
    throw error;
  }
}

const approval = (given: unknown, actor: "human" | "agent"): ProductionApproval => {
  if (actor !== "human") throw new Error("A human must approve this production gate in Studio.");
  return { ...ApprovalInput.parse(given), actor, at: Date.now() };
};

export function saveProposal(projectId: string, expectedRevision: number, given: unknown) {
  const proposal = ProductionProposal.parse(given);
  return mutate(projectId, expectedRevision, (run) => ({
    ...run, stage: "proposal", approvals: { ...run.approvals, proposal: null }, artifacts: { ...run.artifacts, proposal },
  }));
}

export function approveProposal(projectId: string, expectedRevision: number, given: unknown, actor: "human" | "agent") {
  const approved = approval(given, actor);
  return mutate(projectId, expectedRevision, (run) => {
    if (!run.artifacts.proposal) throw new Error("Save a proposal before approving it.");
    return { ...run, stage: run.artifacts.reference ? "storyboard" : "reference", approvals: { ...run.approvals, proposal: approved } };
  });
}

export async function saveReferenceAnalysis(projectId: string, expectedRevision: number, given: unknown) {
  const input = ReferenceAnalysisInput.parse(given);
  const snapshot = readEditor(projectId);
  const media = snapshot.edl.media.find((item) => item.id === input.mediaId);
  if (!media) throw new Error("Reference media is not part of this project.");
  const technical = await probe(media.file);
  const outside = input.evidence.find((item) => item.atSec > technical.durationSec);
  if (outside) throw new Error(`Evidence at ${outside.atSec}s is outside the reference video (${technical.durationSec}s).`);
  return mutate(projectId, expectedRevision, (run) => {
    if (!run.approvals.proposal) throw new Error("Approve the proposal before analyzing references.");
    return { ...run, stage: "storyboard", artifacts: { ...run.artifacts, reference: { ...input, technical: {
      durationSec: technical.durationSec, width: technical.width, height: technical.height, fps: technical.fps,
      hasAudio: technical.hasAudio, videoCodec: technical.videoCodec, audioCodec: technical.audioCodec,
    } } } };
  });
}

export function saveStoryboard(projectId: string, expectedRevision: number, given: unknown) {
  const storyboard = Storyboard.parse(given);
  const ids = new Set<string>();
  for (const scene of storyboard.scenes) {
    if (ids.has(scene.id)) throw new Error(`Storyboard scene id is duplicated: ${scene.id}`);
    ids.add(scene.id);
  }
  return mutate(projectId, expectedRevision, (run) => {
    if (!run.approvals.proposal) throw new Error("Approve the proposal before saving a storyboard.");
    return { ...run, stage: "assets", approvals: { ...run.approvals, assets: null }, artifacts: { ...run.artifacts, storyboard } };
  });
}

export function saveAssetManifest(projectId: string, expectedRevision: number, given: unknown) {
  const assets = AssetManifest.parse(given);
  return mutate(projectId, expectedRevision, (run) => {
    if (!run.artifacts.storyboard) throw new Error("Save a storyboard before its asset manifest.");
    return { ...run, stage: "assets", approvals: { ...run.approvals, assets: null }, artifacts: { ...run.artifacts, assets } };
  });
}

export function approveAssets(projectId: string, expectedRevision: number, given: unknown, actor: "human" | "agent") {
  const approved = approval(given, actor);
  return mutate(projectId, expectedRevision, (run) => {
    const storyboard = run.artifacts.storyboard;
    const manifest = run.artifacts.assets;
    if (!storyboard || !manifest) throw new Error("Save a storyboard and asset manifest before approval.");
    for (const scene of storyboard.scenes) {
      const entries = manifest.assets.filter((asset) => asset.sceneId === scene.id);
      if (!entries.length) throw new Error(`Storyboard scene ${scene.id} has no asset.`);
      if (entries.some((asset) => asset.status !== "ready" && asset.status !== "approved")) throw new Error(`Storyboard scene ${scene.id} still has unfinished assets.`);
    }
    return { ...run, stage: "edit", approvals: { ...run.approvals, assets: approved } };
  });
}

export function addCheckpoint(projectId: string, expectedRevision: number, given: unknown) {
  const input = CheckpointInput.parse(given);
  return mutate(projectId, expectedRevision, (run) => ({
    ...run,
    checkpoints: [...run.checkpoints, { id: `cp_${randomUUID().replaceAll("-", "").slice(0, 16)}`, stage: run.stage, at: Date.now(), ...input }].slice(-100),
  }));
}

export function assertProposalApproved(projectId: string) {
  const run = readProduction(projectId);
  if (run && !run.approvals.proposal) throw new Error("Approve the production proposal before generating paid assets.");
  return run;
}

export function clearProduction(projectId: string) {
  db.prepare("DELETE FROM production_runs WHERE project_id = ?").run(projectId);
  return { cleared: true };
}

export function assertAssetsApproved(projectId: string) {
  const run = readProduction(projectId);
  if (run && (!run.approvals.proposal || !run.approvals.assets)) throw new Error("Approve the production proposal and assets before rendering.");
  return run;
}

export function saveQaReport(projectId: string, expectedRevision: number, report: PostRenderQaReport, completesProduction = true) {
  return mutate(projectId, expectedRevision, (run) => ({
    ...run, stage: completesProduction && report.verdict === "passed" ? "complete" : "qa", artifacts: { ...run.artifacts, qa: report },
  }));
}

export function markRendered(projectId: string, expectedRevision: number) {
  const run = readProduction(projectId);
  return run ? mutate(projectId, expectedRevision, (current) => ({ ...current, stage: "qa" })) : null;
}
