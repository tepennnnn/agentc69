import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { VideoGeneration, VideoGenerationEstimate } from "../types";

let workspace: string;
let database: typeof import("../../../common/server/db");
let config: typeof import("../server/config");
let gateway: typeof import("../server/gateway");
let editor: typeof import("../../editor/server/tools");
let referenceAssetId: string;
let foreignAssetId: string;
let oversizedAssetId: string;
let generatedVideo: Buffer;
const originalFetch = globalThis.fetch;

before(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "agentcut-video-generation-"));
  process.env.AGENTCUT_WORKSPACE = workspace;
  process.env.AGENTCUT_GENERATION_REFERENCE_MAX_BYTES = "1024";
  process.env.AGENTCUT_N8N_COST_PER_SECOND_USD = "0.2";
  const [dbModule, configModule, gatewayModule, editorModule, media, types, store, bins] = await Promise.all([
    import("../../../common/server/db"), import("../server/config"), import("../server/gateway"), import("../../editor/server/tools"),
    import("../../media/server/assets"), import("../../editor/types"), import("../../editor/server/store"), import("../../../common/server/bin"),
  ]);
  database = dbModule; config = configModule; gateway = gatewayModule; editor = editorModule;
  database.q.insertProject({ id: "video-generation-test", name: "Generated video", source_path: "", created_at: Date.now() });
  database.q.insertProject({ id: "video-generation-gated", name: "Gated video", source_path: "", created_at: Date.now() });
  database.q.insertProject({ id: "video-generation-other", name: "Other video", source_path: "", created_at: Date.now() });
  const videoFile = path.join(workspace, "generated.mp4");
  await bins.run(bins.FFMPEG, ["-y", "-f", "lavfi", "-i", "color=c=purple:s=160x90:d=1", "-c:v", "libx264", "-pix_fmt", "yuv420p", videoFile]);
  generatedVideo = await fs.readFile(videoFile);
  for (const id of ["video-generation-test", "video-generation-gated", "video-generation-other"]) {
    store.publishClips(id, types.Edl.parse({ projectId: id, source: null, media: [], clips: [], sequences: [] }));
  }
  const referenceFile = path.join(workspace, "reference.png");
  await fs.writeFile(referenceFile, Buffer.from("89504e470d0a1a0a", "hex"));
  referenceAssetId = (await media.registerAsset({ file: referenceFile, kind: "image", scope: "project", projectId: "video-generation-gated", source: "test" })).id;
  const foreignFile = path.join(workspace, "foreign.png");
  await fs.writeFile(foreignFile, Buffer.from("89504e470d0a1a0b", "hex"));
  foreignAssetId = (await media.registerAsset({ file: foreignFile, kind: "image", scope: "project", projectId: "video-generation-other", source: "test" })).id;
  const oversizedFile = path.join(workspace, "oversized.png");
  await fs.writeFile(oversizedFile, Buffer.alloc(2048, 1));
  oversizedAssetId = (await media.registerAsset({ file: oversizedFile, kind: "image", scope: "project", projectId: "video-generation-gated", source: "test" })).id;
});

after(async () => {
  globalThis.fetch = originalFetch;
  delete process.env.AGENTCUT_GENERATION_REFERENCE_MAX_BYTES;
  delete process.env.AGENTCUT_N8N_COST_PER_SECOND_USD;
  // node:sqlite keeps its WAL handles open until the test process exits on Windows.
  await fs.rm(workspace, { recursive: true, force: true }).catch(() => undefined);
});

test("the n8n bridge keeps its token private and submits an idempotent request", async () => {
  const visible = config.setVideoGenerationConfig({
    submitUrl: "https://n8n.example.test/webhook/generate",
    statusUrl: "https://n8n.example.test/webhook/status",
    outputHosts: "objectstorage.example.test",
    token: "test-secret-token",
  });
  assert.equal(visible.configured, true);
  assert.equal(visible.tokenSet, true);
  assert.equal(JSON.stringify(visible).includes("test-secret-token"), false);

  let received: { authorization: string; requestId: string; body: Record<string, unknown> } | undefined;
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    received = {
      authorization: new Headers(init?.headers).get("authorization") ?? "",
      requestId: new Headers(init?.headers).get("x-agentcut-request-id") ?? "", body,
    };
    return Response.json({ requestId: body.requestId, status: "queued" });
  };
  const result = await gateway.submitVideoGeneration("video-generation-test", { prompt: "A paper boat crossing a moonlit puddle", aspectRatio: "16:9" }) as VideoGeneration;
  assert.equal(result.status, "queued");
  assert.equal(received?.authorization, "Bearer test-secret-token");
  assert.equal(received?.requestId, result.id);
  assert.equal(received?.body.requestId, result.id);
  assert.match(String(received?.body.prompt), /cinematic/i);
  assert.equal(result.provenance.originalPrompt, "A paper boat crossing a moonlit puddle");
});

test("estimate-only enhances the shared prompt and never calls the provider", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("estimate must not fetch"); };

  const estimate = await gateway.submitVideoGeneration("video-generation-test", {
    prompt: "Please create a video of a paper kite", aspectRatio: "16:9", durationSeconds: 4, estimateOnly: true,
  }) as VideoGenerationEstimate;

  assert.equal(estimate.estimateOnly, true);
  assert.equal(estimate.provider, "n8n");
  assert.equal(estimate.estimatedCostUsd, 0.8);
  assert.match(estimate.prompt, /cinematic/i);
  assert.equal(calls, 0);
});

test("an active production blocks submission until proposal approval, then forwards provider inputs and inline references", async () => {
  const production = await import("../../production/server/workflow");
  let run = production.startProduction("video-generation-gated", { brief: "Generate the hook", target: "Short" });
  let calls = 0;
  globalThis.fetch = async (_input, init) => {
    calls++;
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ requestId: body.requestId, status: "queued" });
  };

  await assert.rejects(() => gateway.submitVideoGeneration("video-generation-gated", { prompt: "A product turning", aspectRatio: "9:16" }), /approve the production proposal/i);
  assert.equal(calls, 0);
  run = production.saveProposal("video-generation-gated", run.revision, {
    concept: "Product reveal", durationSeconds: 6, provider: "n8n", voice: "", music: "", estimatedCostUsd: 1.2,
  });
  production.approveProposal("video-generation-gated", run.revision, {}, "human");

  let submitted: Record<string, unknown> | undefined;
  globalThis.fetch = async (_input, init) => {
    calls++;
    submitted = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ requestId: submitted.requestId, status: "queued" });
  };
  const result = await gateway.submitVideoGeneration("video-generation-gated", {
    prompt: "A product turning", aspectRatio: "9:16", durationSeconds: 6, provider: "n8n", model: "veo-test",
    mode: "image-to-video", referenceAssetIds: [referenceAssetId], startFrameAssetId: referenceAssetId,
    seed: 42, resolution: "1080p", fps: 24, generateAudio: false, negativePrompt: "text", enhancePrompt: true,
  }) as VideoGeneration;

  assert.equal(result.provider, "n8n");
  assert.equal(result.model, "veo-test");
  assert.equal(result.estimatedCostUsd, 1.2);
  assert.equal(result.provenance.seed, 42);
  assert.deepEqual(result.provenance.inputAssetIds, [referenceAssetId]);
  assert.equal((submitted?.referenceAssets as Array<{ dataUrl: string }>).length, 1);
  assert.match((submitted?.referenceAssets as Array<{ dataUrl: string }>)[0].dataUrl, /^data:image\/png;base64,/);
});

test("inaccessible or oversized references fail before the provider is called", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ status: "queued" }); };
  await assert.rejects(() => gateway.submitVideoGeneration("video-generation-gated", {
    prompt: "Foreign reference", aspectRatio: "16:9", referenceAssetIds: [foreignAssetId],
  }), /not available to this project/i);
  await assert.rejects(() => gateway.submitVideoGeneration("video-generation-gated", {
    prompt: "Oversized reference", aspectRatio: "16:9", referenceAssetIds: [oversizedAssetId],
  }), /reference payload/i);
  assert.equal(calls, 0);
});

test("completed generation persists remote cost and the verified output checksum", async () => {
  const { createHash } = await import("node:crypto");
  const checksum = createHash("sha256").update(generatedVideo).digest("hex");
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("objectstorage.example.test")) return new Response(new Uint8Array(generatedVideo), { headers: { "content-type": "video/mp4", "content-length": String(generatedVideo.length) } });
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ requestId: body.requestId, status: "ready", costUsd: 0.73, downloadUrl: "https://objectstorage.example.test/output.mp4", sha256: checksum });
  };

  const result = await gateway.submitVideoGeneration("video-generation-test", {
    prompt: "A verified output", aspectRatio: "16:9", durationSeconds: 4, model: "veo-test", seed: 7,
  }) as VideoGeneration;

  assert.equal(result.status, "ready");
  assert.equal(result.actualCostUsd, 0.73);
  assert.equal(result.outputSha256, checksum);
  assert.equal(result.provenance.remoteJobId, result.id);
  assert.ok(result.outputMediaId);
});

test("a status response without cost preserves the last provider cost", async () => {
  let status = false;
  globalThis.fetch = async (_input, init) => {
    if (!init?.body) { status = true; return Response.json({ status: "generating", progress: 0.5 }); }
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    return Response.json({ requestId: body.requestId, status: "queued", costUsd: 0.42 });
  };
  const submitted = await gateway.submitVideoGeneration("video-generation-test", { prompt: "Costed queue", aspectRatio: "16:9" }) as VideoGeneration;
  assert.equal(submitted.actualCostUsd, 0.42);
  database.db.prepare("UPDATE video_generations SET updated_at = 0 WHERE id = ?").run(submitted.id);
  const refreshed = await gateway.refreshVideoGeneration(submitted.id, "video-generation-test");
  assert.equal(status, true);
  assert.equal(refreshed.actualCostUsd, 0.42);
});

test("video.generate accepts the editor tool discriminator without forwarding it to the strict request schema", async () => {
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ requestId: body.requestId, status: "queued" });
  };

  const result = await editor.executeEditorTool("video-generation-test", {
    tool: "video.generate",
    prompt: "A queue-only connection test",
    aspectRatio: "16:9",
  });

  assert.equal((result as { status: string }).status, "queued");
});
