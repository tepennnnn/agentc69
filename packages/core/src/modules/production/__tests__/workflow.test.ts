import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

let workspace: string;
let workflow: typeof import("../server/workflow");

before(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "agentcut-production-"));
  process.env.AGENTCUT_WORKSPACE = workspace;
  const [{ db, q }, { Edl }, store, { FFMPEG, run }] = await Promise.all([
    import("../../../common/server/db"), import("../../editor/types"), import("../../editor/server/store"), import("../../../common/server/bin"),
  ]);
  for (const id of ["workflow-gates", "workflow-artifacts", "workflow-checkpoints", "workflow-auth"]) {
    q.insertProject({ id, name: id, source_path: "", created_at: Date.now() });
  }
  const reference = path.join(workspace, "reference.mp4");
  await run(FFMPEG, ["-y", "-f", "lavfi", "-i", "color=c=blue:s=160x90:d=2", "-f", "lavfi", "-i", "sine=frequency=440:duration=2", "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", reference]);
  const edl = Edl.parse({ projectId: "workflow-artifacts", source: null, media: [{ id: "reference", name: "Reference", file: reference, width: 160, height: 90, fps: 25, durationSec: 2 }], clips: [], sequences: [] });
  store.publishClips("workflow-artifacts", edl);
  assert.ok(db);
  workflow = await import("../server/workflow");
});

after(async () => {
  await fs.rm(workspace, { recursive: true, force: true }).catch(() => undefined);
});

const proposal = {
  concept: "A concise faceless explainer",
  durationSeconds: 30,
  provider: "n8n",
  voice: "Local Chatterbox",
  music: "Openverse instrumental",
  estimatedCostUsd: 1.5,
};

test("proposal approval is revision-safe and replacing the proposal invalidates only that approval", async () => {
  const started = workflow.startProduction("workflow-gates", { brief: "Explain the change", target: "YouTube" });
  assert.equal(started.revision, 1);
  assert.equal(started.stage, "proposal");
  assert.throws(() => workflow.startProduction("workflow-gates", { brief: "overwrite", target: "none" }), /already has a production run/i);

  const saved = workflow.saveProposal("workflow-gates", 1, proposal);
  const approved = workflow.approveProposal("workflow-gates", saved.revision, { note: "Proceed" }, "human");
  assert.equal(approved.stage, "reference");
  assert.equal(approved.approvals.proposal?.actor, "human");
  assert.throws(() => workflow.saveProposal("workflow-gates", saved.revision, proposal), (error: unknown) => {
    assert.equal((error as { current?: { revision?: number } }).current?.revision, approved.revision);
    return true;
  });

  const replaced = workflow.saveProposal("workflow-gates", approved.revision, { ...proposal, concept: "A sharper explainer" });
  assert.equal(replaced.approvals.proposal, null);
  assert.equal(replaced.stage, "proposal");
});

test("reference facts come from the host and asset approval requires every storyboard scene", async () => {
  let run = workflow.startProduction("workflow-artifacts", { brief: "Match the useful pacing", target: "Short" });
  run = workflow.saveProposal("workflow-artifacts", run.revision, proposal);
  run = workflow.approveProposal("workflow-artifacts", run.revision, {}, "human");

  await assert.rejects(() => workflow.saveReferenceAnalysis("workflow-artifacts", run.revision, {
    mediaId: "reference", hook: "Immediate visual", structure: "hook, proof, payoff", pacing: "fast", visualLanguage: "clean", audioApproach: "voice-led", retain: ["pacing"], change: ["branding"], evidence: [{ atSec: 99, note: "outside" }],
  }), /outside the reference video/i);

  run = await workflow.saveReferenceAnalysis("workflow-artifacts", run.revision, {
    mediaId: "reference", hook: "Immediate visual", structure: "hook, proof, payoff", pacing: "fast", visualLanguage: "clean", audioApproach: "voice-led", retain: ["pacing"], change: ["branding"], evidence: [{ atSec: 0.5, note: "opening visual" }],
  });
  assert.equal(run.stage, "storyboard");
  assert.deepEqual(run.artifacts.reference?.technical, { durationSec: 2, width: 160, height: 90, fps: 25, hasAudio: true, videoCodec: "h264", audioCodec: "aac" });

  run = workflow.saveStoryboard("workflow-artifacts", run.revision, { scenes: [
    { id: "hook", durationSeconds: 4, purpose: "Hook", visualPrompt: "Opening", narration: "Look", transition: "cut", referenceAssetIds: [] },
    { id: "proof", durationSeconds: 8, purpose: "Proof", visualPrompt: "Detail", narration: "Here is why", transition: "dissolve", referenceAssetIds: [] },
  ] });
  assert.equal(run.stage, "assets");
  run = workflow.saveAssetManifest("workflow-artifacts", run.revision, { assets: [
    { id: "a1", sceneId: "hook", assetId: "reference", provider: "existing", status: "ready", costUsd: 0, provenance: {} },
  ] });
  assert.throws(() => workflow.approveAssets("workflow-artifacts", run.revision, {}, "human"), /proof/i);

  run = workflow.saveAssetManifest("workflow-artifacts", run.revision, { assets: [
    { id: "a1", sceneId: "hook", assetId: "reference", provider: "existing", status: "ready", costUsd: 0, provenance: {} },
    { id: "a2", sceneId: "proof", assetId: "reference", provider: "existing", status: "ready", costUsd: 0, provenance: {} },
  ] });
  run = workflow.approveAssets("workflow-artifacts", run.revision, { note: "Assets approved" }, "human");
  assert.equal(run.stage, "edit");
  assert.equal(run.approvals.assets?.actor, "human");

  run = workflow.saveAssetManifest("workflow-artifacts", run.revision, run.artifacts.assets!);
  assert.equal(run.approvals.assets, null);
  assert.equal(run.stage, "assets");
  assert.throws(() => workflow.markRendered("workflow-artifacts", run.revision - 1), /changed elsewhere/i);
});

test("approval authority comes from the trusted transport instead of caller input", async () => {
  const editor = await import("../../editor/server/tools");
  const activity = await import("../../project/server/activity-log");
  let run = workflow.startProduction("workflow-auth", { brief: "Require a person", target: "Local" });
  run = workflow.saveProposal("workflow-auth", run.revision, proposal);
  const request = { tool: "production.proposal.approve", expectedRevision: run.revision, approval: { note: "Looks good" } };
  await assert.rejects(() => editor.executeEditorTool("workflow-auth", request), /human must approve/i);
  await assert.rejects(() => activity.runReportedTool("workflow-auth", request, { via: "mcp" }), /human must approve/i);
  const approved = await activity.runReportedTool("workflow-auth", request, { via: "web" }) as import("../types").ProductionRun;
  assert.equal(approved.approvals.proposal?.actor, "human");
});

test("checkpoints are append-only resume markers bounded to the latest one hundred", () => {
  let run = workflow.startProduction("workflow-checkpoints", { brief: "Checkpoint it", target: "Local" });
  for (let index = 0; index < 105; index++) {
    run = workflow.addCheckpoint("workflow-checkpoints", run.revision, { summary: `step ${index}`, completedSceneIds: [], pendingSceneIds: [], spendUsd: index });
  }
  assert.equal(run.checkpoints.length, 100);
  assert.equal(run.checkpoints[0].summary, "step 5");
  assert.equal(run.checkpoints.at(-1)?.summary, "step 104");
});
