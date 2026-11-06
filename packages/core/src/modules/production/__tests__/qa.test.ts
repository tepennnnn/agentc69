import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

let workspace: string;
let qa: typeof import("../server/qa");
let workflow: typeof import("../server/workflow");
let renderProject: typeof import("../../render/server/render-project").renderProject;
let projectDir: typeof import("../../../common/server/config").projectDir;

before(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "agentcut-production-qa-"));
  process.env.AGENTCUT_WORKSPACE = workspace;
  const [database, types, store, bins, config, signature] = await Promise.all([
    import("../../../common/server/db"), import("../../editor/types"), import("../../editor/server/store"),
    import("../../../common/server/bin"), import("../../../common/server/config"), import("../../editor/server/signature"),
  ]);
  projectDir = config.projectDir;
  const edlFor = (id: string) => types.Edl.parse({
    projectId: id, source: null, media: [], clips: [], sequences: [{
      id: "main", title: "Main", output: { width: 160, height: 90, fps: 25 }, items: [{
        id: "scene", mediaId: null, at: 0, layer: 0,
        clip: { id: "scene", title: "Scene", start: 0, end: 1, captions: { preset: "none" }, edits: [] },
      }],
    }],
  });
  for (const id of ["qa-valid", "qa-missing", "qa-render-gate"]) {
    database.q.insertProject({ id, name: id, source_path: "", created_at: Date.now() });
    store.publishClips(id, edlFor(id));
  }
  const output = path.join(workspace, "qa-output.mp4");
  await bins.run(bins.FFMPEG, ["-y", "-f", "lavfi", "-i", "color=c=black:s=160x90:d=1", "-c:v", "libx264", "-pix_fmt", "yuv420p", output]);
  database.q.insertProject({ id: "qa-clip", name: "qa-clip", source_path: output, created_at: Date.now() });
  store.publishClips("qa-clip", types.Edl.parse({
    projectId: "qa-clip", source: { file: output, width: 160, height: 90, fps: 25, durationSec: 1 }, media: [], sequences: [],
    clips: [{ id: "legacy", title: "Legacy clip", start: 0, end: 1, captions: { preset: "none" }, edits: [] }],
  }));
  const dir = projectDir("qa-valid");
  await fs.mkdir(path.join(dir, "clips"), { recursive: true });
  await fs.copyFile(output, path.join(dir, "clips", "main.mp4"));
  const snapshot = store.readEditor("qa-valid");
  await fs.writeFile(path.join(dir, "rendered.json"), JSON.stringify({
    main: { revision: snapshot.revision, file: "main.mp4", signature: signature.contentSignature(snapshot.edl, "main") },
  }));
  const clipDir = projectDir("qa-clip");
  await fs.mkdir(path.join(clipDir, "clips"), { recursive: true });
  await fs.copyFile(output, path.join(clipDir, "clips", "legacy.mp4"));
  const clipSnapshot = store.readEditor("qa-clip");
  await fs.writeFile(path.join(clipDir, "rendered.json"), JSON.stringify({
    legacy: { revision: clipSnapshot.revision, file: "legacy.mp4", signature: signature.contentSignature(clipSnapshot.edl, "legacy") },
  }));
  workflow = await import("../server/workflow");
  qa = await import("../server/qa");
  ({ renderProject } = await import("../../render/server/render-project"));
});

after(async () => {
  await fs.rm(workspace, { recursive: true, force: true }).catch(() => undefined);
});

function approve(id: string) {
  let run = workflow.startProduction(id, { brief: "Render with evidence", target: "Local" });
  run = workflow.saveProposal(id, run.revision, { concept: "QA", durationSeconds: 1, provider: "n8n", voice: "", music: "", estimatedCostUsd: 0 });
  run = workflow.approveProposal(id, run.revision, {}, "human");
  run = workflow.saveStoryboard(id, run.revision, { scenes: [{ id: "scene", durationSeconds: 1, purpose: "Show", visualPrompt: "Black frame", narration: "", transition: "cut", referenceAssetIds: [] }] });
  run = workflow.saveAssetManifest(id, run.revision, { assets: [{ id: "asset", sceneId: "scene", assetId: "existing", provider: "existing", status: "ready", costUsd: 0, provenance: {} }] });
  return workflow.approveAssets(id, run.revision, {}, "human");
}

test("core rendering refuses an active production whose assets are not approved", async () => {
  workflow.startProduction("qa-render-gate", { brief: "Gate render", target: "Local" });
  await assert.rejects(() => renderProject("qa-render-gate", { only: ["main"] }), /approve the production proposal and assets/i);
});

test("scoped QA persists evidence without completing production; full QA completes it", async () => {
  const approved = approve("qa-valid");
  const report = await qa.runPostRenderQa("qa-valid", approved.revision, "main");

  assert.equal(report.verdict, "passed");
  assert.equal(report.outputs.length, 1);
  const output = report.outputs[0] as { probe: { width: number; height: number; durationSec: number }; style: unknown; review: unknown };
  assert.deepEqual({ width: output.probe.width, height: output.probe.height }, { width: 160, height: 90 });
  assert.ok(output.probe.durationSec > 0.9 && output.probe.durationSec < 1.1);
  assert.ok(output.style);
  assert.ok(output.review);
  let stored = workflow.readProduction("qa-valid")!;
  assert.equal(stored.stage, "qa");
  const full = await qa.runPostRenderQa("qa-valid", stored.revision);
  assert.equal(full.verdict, "passed");
  stored = workflow.readProduction("qa-valid")!;
  assert.equal(stored.stage, "complete");
  assert.equal(stored.artifacts.qa?.verdict, "passed");
});

test("full QA validates legacy clip deliverables as well as sequences", async () => {
  const approved = approve("qa-clip");
  const report = await qa.runPostRenderQa("qa-clip", approved.revision);
  assert.equal(report.verdict, "passed");
  assert.deepEqual(report.outputs.map((output) => [output.kind, output.deliverableId]), [["clip", "legacy"]]);
  assert.equal(workflow.readProduction("qa-clip")?.stage, "complete");
});

test("missing render evidence becomes a durable failed QA report", async () => {
  const approved = approve("qa-missing");
  const report = await qa.runPostRenderQa("qa-missing", approved.revision, "main");

  assert.equal(report.verdict, "failed");
  assert.match(report.findings[0].message, /not rendered|manifest/i);
  const stored = workflow.readProduction("qa-missing")!;
  assert.equal(stored.stage, "qa");
  assert.equal(stored.artifacts.qa?.verdict, "failed");
});
