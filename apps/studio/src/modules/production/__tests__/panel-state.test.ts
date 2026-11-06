import { test } from "node:test";
import assert from "node:assert/strict";
import type { ProductionRun } from "@agentcut/core/modules/production/types";
import { productionAction, productionPanelState } from "../lib/panel-state";

const run = (patch: Partial<ProductionRun> = {}): ProductionRun => ({
  projectId: "p", revision: 7, brief: "Brief", target: "YouTube", stage: "proposal",
  approvals: { proposal: null, assets: null },
  artifacts: { proposal: null, reference: null, storyboard: null, assets: null, qa: null },
  checkpoints: [], createdAt: 1, updatedAt: 1, ...patch,
});

test("panel state exposes stage, resume marker and only valid approvals", () => {
  assert.deepEqual(productionPanelState(null), {
    stage: "not-started", canApproveProposal: false, canApproveAssets: false, canRunQa: false, canEstimate: true, resumeSummary: "No checkpoint yet",
  });
  const proposed = run({ artifacts: { ...run().artifacts, proposal: { concept: "Concept", durationSeconds: 30, provider: "n8n", voice: "", music: "", estimatedCostUsd: 1, notes: "" } } });
  assert.equal(productionPanelState(proposed).canApproveProposal, true);

  const storyboard = { scenes: [{ id: "one", durationSeconds: 4, purpose: "Hook", visualPrompt: "Visual", narration: "", transition: "cut", referenceAssetIds: [] }] };
  const manifest = { assets: [{ id: "a", sceneId: "one", assetId: "asset", provider: "n8n", status: "ready" as const, costUsd: 0, provenance: {}, note: "" }] };
  const ready = run({ stage: "assets", artifacts: { ...proposed.artifacts, storyboard, assets: manifest }, checkpoints: [{ id: "cp", stage: "assets", at: 2, summary: "Assets generated", completedSceneIds: ["one"], pendingSceneIds: [], spendUsd: 0 }] });
  assert.equal(productionPanelState(ready).canApproveAssets, true);
  assert.equal(productionPanelState(ready).resumeSummary, "Assets generated");
  assert.equal(productionPanelState(run({ stage: "assets", artifacts: { ...proposed.artifacts, storyboard, assets: { assets: [] } } })).canApproveAssets, false);
});

test("panel actions always carry the production revision", () => {
  assert.deepEqual(productionAction(run(), "approve-proposal"), {
    tool: "production.proposal.approve", expectedRevision: 7, approval: { note: "Approved in Studio" },
  });
  assert.deepEqual(productionAction(run(), "run-qa"), { tool: "production.qa.run", expectedRevision: 7 });
});
