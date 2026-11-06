import type { ProductionRun } from "@agentcut/core/modules/production/types";

export function productionPanelState(run: ProductionRun | null) {
  const storyboard = run?.artifacts.storyboard;
  const manifest = run?.artifacts.assets;
  const readyScenes = new Set((manifest?.assets ?? []).filter((asset) => asset.status === "ready" || asset.status === "approved").map((asset) => asset.sceneId));
  return {
    stage: run?.stage ?? "not-started",
    canApproveProposal: Boolean(run?.artifacts.proposal && !run.approvals.proposal),
    canApproveAssets: Boolean(storyboard?.scenes.length && storyboard.scenes.every((scene) => readyScenes.has(scene.id)) && !run?.approvals.assets),
    canRunQa: run?.stage === "qa",
    canEstimate: true,
    resumeSummary: run?.checkpoints.at(-1)?.summary ?? "No checkpoint yet",
  };
}

export function productionAction(run: ProductionRun, action: "approve-proposal" | "approve-assets" | "run-qa") {
  if (action === "approve-proposal") return { tool: "production.proposal.approve", expectedRevision: run.revision, approval: { note: "Approved in Studio" } };
  if (action === "approve-assets") return { tool: "production.assets.approve", expectedRevision: run.revision, approval: { note: "Approved in Studio" } };
  return { tool: "production.qa.run", expectedRevision: run.revision };
}
