import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash, randomUUID } from "node:crypto";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { FFMPEG, run } from "../../../common/server/bin";
import { projectDir } from "../../../common/server/config";
import { q } from "../../../common/server/db";
import { readEditor } from "../../editor/server/store";
import { toAbs } from "../../media/server/assets";
import { importProjectMedia } from "../../media/server/media-import";
import { assertProposalApproved } from "../../production/server/workflow";
import { polishVideoPrompt } from "../lib/prompt-enhancer";
import { VideoGenerationRequest, type VideoGeneration, type VideoGenerationEstimate, type VideoGenerationProvenance, type VideoGenerationStatus } from "../types";
import { resolvedVideoGenerationConfig } from "./config";
import { createGeneration, getGeneration, listGenerations, updateGeneration } from "./store";

const ACTIVE = new Set<VideoGenerationStatus>(["submitting", "queued", "generating"]);
const TRANSFERRING = new Set<VideoGenerationStatus>(["downloading", "importing"]);
const MAX_BYTES = Number(process.env.AGENTCUT_GENERATION_MAX_BYTES || 1024 * 1024 * 1024);
const REFRESH_AFTER_MS = 2_500;
const RECOVER_TRANSFER_AFTER_MS = 10 * 60_000;
const REFERENCE_MAX_BYTES = Number(process.env.AGENTCUT_GENERATION_REFERENCE_MAX_BYTES || 32 * 1024 * 1024);

type RemoteResult = Record<string, unknown>;

function headers(token: string) {
  return { authorization: `Bearer ${token}`, "content-type": "application/json", accept: "application/json" };
}

async function json(response: Response): Promise<RemoteResult> {
  const body = await response.json().catch(() => ({})) as RemoteResult;
  if (!response.ok) {
    const message = typeof body.error === "string" ? body.error : typeof body.message === "string" ? body.message : `HTTP ${response.status}`;
    throw new Error(`Video generation service: ${message}`);
  }
  return body;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function remoteId(body: RemoteResult, fallback: string) {
  return text(body.requestId) ?? text(body.remoteJobId) ?? text(body.jobId) ?? text(body.id) ?? fallback;
}

function normalizeStatus(value: unknown): VideoGenerationStatus {
  const status = String(value ?? "queued").toLowerCase();
  if (["pending", "submitted", "accepted", "queued"].includes(status)) return "queued";
  if (["running", "processing", "generating", "in_progress", "in-progress"].includes(status)) return "generating";
  if (["completed", "complete", "ready", "done", "success", "succeeded"].includes(status)) return "ready";
  if (["cancelled", "canceled"].includes(status)) return "cancelled";
  if (["failed", "error"].includes(status)) return "failed";
  return "queued";
}

function output(body: RemoteResult): RemoteResult {
  return body.output && typeof body.output === "object" ? body.output as RemoteResult : body;
}

function money(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value * 10000) / 10000 : null;
}

function estimate(request: VideoGenerationRequest): number | null {
  const rate = Number(process.env.AGENTCUT_N8N_COST_PER_SECOND_USD);
  return Number.isFinite(rate) && rate >= 0 ? Math.round(rate * request.durationSeconds * 10000) / 10000 : null;
}

function mime(file: string, kind: "image" | "video") {
  const extension = path.extname(file).toLowerCase();
  if (kind === "video") return extension === ".webm" ? "video/webm" : "video/mp4";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  return "image/png";
}

async function compressImageForPayload(sourceFile: string): Promise<{ buffer: Buffer; mime: string }> {
  const tmpOut = path.join(os.tmpdir(), `ref_opt_${randomUUID()}.jpg`);
  try {
    await run(FFMPEG, [
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", sourceFile,
      "-vf", "scale='min(1280,iw)':-2",
      "-q:v", "4",
      "-update", "1",
      "-frames:v", "1",
      tmpOut,
    ]);
    const buffer = await fsp.readFile(tmpOut);
    return { buffer, mime: "image/jpeg" };
  } catch {
    const buffer = await fsp.readFile(sourceFile);
    return { buffer, mime: mime(sourceFile, "image") };
  } finally {
    void fsp.rm(tmpOut, { force: true }).catch(() => {});
  }
}

async function resolveReferenceAssets(projectId: string, request: VideoGenerationRequest) {
  const expected = new Map<string, "image" | "video">();
  for (const id of request.referenceAssetIds) expected.set(id, "image");
  if (request.startFrameAssetId) expected.set(request.startFrameAssetId, "image");
  if (request.endFrameAssetId) expected.set(request.endFrameAssetId, "image");
  if (request.sourceVideoAssetId) expected.set(request.sourceVideoAssetId, "video");
  if (!expected.size) return [];
  const accessible = new Map([
    ...q.listAssets("image", projectId).map((asset) => [asset.id, asset] as const),
    ...q.listAssets("video", projectId).map((asset) => [asset.id, asset] as const),
  ]);
  const selected = [...expected].map(([id, kind]) => {
    const asset = accessible.get(id);
    if (!asset) throw new Error(`Reference asset ${id} is not available to this project.`);
    if (asset.kind !== kind) throw new Error(`Reference asset ${id} must be ${kind === "image" ? "an image" : "a video"}.`);
    if (asset.kind === "image" && asset.path.toLowerCase().endsWith(".svg")) {
      throw new Error(`Reference asset ${id} (${asset.name}) is an SVG graphic. Video generation requires photorealistic raster images (PNG, JPG, or WEBP).`);
    }
    return { asset, file: toAbs(asset.path) };
  });
  const sized = await Promise.all(selected.map(async (item) => ({ ...item, bytes: (await fsp.stat(item.file)).size })));
  if (sized.reduce((sum, item) => sum + item.bytes, 0) > REFERENCE_MAX_BYTES) {
    throw new Error(`Reference payload is larger than this Agent Cut installation allows (${REFERENCE_MAX_BYTES} bytes).`);
  }
  return Promise.all(sized.map(async ({ asset, file, bytes }) => {
    let buffer: Buffer;
    let payloadMime: string;

    if (asset.kind === "image" && bytes > 300 * 1024) {
      const compressed = await compressImageForPayload(file);
      buffer = compressed.buffer;
      payloadMime = compressed.mime;
    } else {
      buffer = await fsp.readFile(file);
      payloadMime = mime(file, asset.kind as "image" | "video");
    }

    return {
      id: asset.id, name: asset.name, kind: asset.kind,
      dataUrl: `data:${payloadMime};base64,${buffer.toString("base64")}`,
    };
  }));
}

function allowedOutput(raw: string, hosts: string[]) {
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:") throw new Error("Generated video URL must use HTTPS");
  const host = parsed.hostname.toLowerCase();
  if (!hosts.some(allowed => host === allowed || (allowed.startsWith(".") && host.endsWith(allowed)))) {
    throw new Error(`Generated video host ${host} is not in the configured allow-list`);
  }
  return parsed;
}

async function downloadAndImport(generation: VideoGeneration, body: RemoteResult): Promise<VideoGeneration> {
  const config = resolvedVideoGenerationConfig();
  const remote = output(body);
  const rawUrl = text(remote.downloadUrl) ?? text(remote.outputUrl) ?? text(remote.url);
  if (!rawUrl) throw new Error("Generation completed without a download URL");
  const url = allowedOutput(rawUrl, config.outputHosts);
  updateGeneration(generation.id, { status: "downloading", progress: 0.9, stage: "Downloading generated video", error: null });
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(10 * 60_000) });
  if (!response.ok || !response.body) throw new Error(`Generated video download failed (HTTP ${response.status})`);
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_BYTES) throw new Error("Generated video is larger than this Agent Cut installation allows");
  const type = (response.headers.get("content-type") || "").toLowerCase();
  if (type && !type.startsWith("video/") && !type.startsWith("application/octet-stream")) throw new Error(`Generated output is not a video (${type})`);

  const dir = path.join(projectDir(generation.projectId), "generation-downloads");
  await fsp.mkdir(dir, { recursive: true });
  const filename = `${generation.id}${path.extname(url.pathname) || ".mp4"}`;
  const file = path.join(dir, filename);
  let bytes = 0;
  const hash = createHash("sha256");
  const meter = new Transform({ transform(chunk, _encoding, callback) {
    bytes += chunk.length;
    if (bytes > MAX_BYTES) return callback(new Error("Generated video is larger than this Agent Cut installation allows"));
    hash.update(chunk);
    callback(null, chunk);
  } });
  try {
    await pipeline(Readable.fromWeb(response.body as never), meter, fs.createWriteStream(file, { flags: "wx" }));
    const expected = text(remote.sha256)?.replace(/^sha256:/i, "").toLowerCase();
    const actual = hash.digest("hex");
    if (expected && expected !== actual) throw new Error("Generated video checksum did not match");
    updateGeneration(generation.id, { status: "importing", progress: 0.97, stage: "Importing into project" });
    const before = readEditor(generation.projectId);
    const place = generation.request.autoPlace && generation.request.sequenceId
      ? { sequenceId: generation.request.sequenceId, at: generation.request.placeAt, layer: generation.request.layer }
      : undefined;
    const imported = await importProjectMedia(generation.projectId, before.revision, { file }, place, { transcribe: false, by: "video.generate" });
    const known = new Set(before.edl.media.map(media => media.id));
    const media = imported.edl.media.find(item => !known.has(item.id));
    if (!media) throw new Error("Generated video was downloaded but could not be identified after import");
    const actualCost = money(remote.costUsd ?? body.costUsd);
    return updateGeneration(generation.id, {
      status: "ready", progress: 1, stage: "Ready in project assets", output_media_id: media.id,
      output_sha256: actual, ...(actualCost === null ? {} : { actual_cost_usd: actualCost }), error: null,
    });
  } finally {
    await fsp.rm(file, { force: true }).catch(() => undefined);
  }
}

export async function submitVideoGeneration(projectId: string, input: unknown): Promise<VideoGeneration | VideoGenerationEstimate> {
  const parsed = VideoGenerationRequest.parse(input);
  const originalPrompt = parsed.prompt;
  const request = VideoGenerationRequest.parse({
    ...parsed,
    prompt: parsed.enhancePrompt ? polishVideoPrompt(parsed.prompt, parsed) : parsed.prompt,
  });
  const inputAssetIds = [...new Set([
    ...request.referenceAssetIds, request.startFrameAssetId, request.endFrameAssetId, request.sourceVideoAssetId,
  ].filter((id): id is string => Boolean(id)))];
  const provenance: VideoGenerationProvenance = {
    provider: request.provider, model: request.model ?? null, mode: request.mode,
    originalPrompt, enhancedPrompt: request.prompt, inputAssetIds, seed: request.seed ?? null, remoteJobId: null,
  };
  const estimatedCostUsd = estimate(request);
  if (request.estimateOnly) {
    return { estimateOnly: true, provider: request.provider, model: request.model ?? null, prompt: request.prompt, estimatedCostUsd, request, provenance };
  }
  assertProposalApproved(projectId);
  const references = await resolveReferenceAssets(projectId, request);
  const config = resolvedVideoGenerationConfig();
  const generation = createGeneration(projectId, request, provenance, estimatedCostUsd);
  try {
    const response = await fetch(config.submitUrl, {
      method: "POST", headers: { ...headers(config.token), "x-agentcut-request-id": generation.id }, signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        requestId: generation.id, projectId, provider: request.provider, model: request.model, mode: request.mode,
        prompt: request.prompt, negativePrompt: request.negativePrompt, aspectRatio: request.aspectRatio,
        durationSeconds: request.durationSeconds, resolution: request.resolution, fps: request.fps,
        generateAudio: request.generateAudio, seed: request.seed, referenceAssets: references,
        referenceAssetIds: request.referenceAssetIds, startFrameAssetId: request.startFrameAssetId,
        endFrameAssetId: request.endFrameAssetId, sourceVideoAssetId: request.sourceVideoAssetId,
        metadata: { sequenceId: request.sequenceId, placeAt: request.placeAt, layer: request.layer, autoPlace: request.autoPlace },
      }),
    });
    const body = await json(response);
    const actualCost = money(body.costUsd);
    const accepted = updateGeneration(generation.id, {
      remote_id: remoteId(body, generation.id), ...(actualCost === null ? {} : { actual_cost_usd: actualCost }),
      status: normalizeStatus(body.status), progress: 0.05, stage: "Queued by generation service", error: null,
    });
    return accepted.status === "ready" ? await downloadAndImport(accepted, body) : accepted;
  } catch (error) {
    updateGeneration(generation.id, { status: "failed", stage: "Submission failed", error: (error as Error).message });
    throw error;
  }
}

export async function refreshVideoGeneration(id: string, projectId?: string): Promise<VideoGeneration> {
  const generation = getGeneration(id);
  if (!generation || (projectId && generation.projectId !== projectId)) throw new Error("Video generation not found");
  const age = Date.now() - generation.updatedAt;
  const recoverTransfer = TRANSFERRING.has(generation.status) && age >= RECOVER_TRANSFER_AFTER_MS;
  if ((!ACTIVE.has(generation.status) && !recoverTransfer) || age < REFRESH_AFTER_MS) return generation;
  const config = resolvedVideoGenerationConfig();
  try {
    const url = new URL(config.statusUrl);
    url.searchParams.set("requestId", generation.remoteId ?? generation.id);
    const body = await json(await fetch(url, { headers: headers(config.token), signal: AbortSignal.timeout(30_000) }));
    const status = normalizeStatus(body.status);
    if (status === "ready") return await downloadAndImport(generation, body);
    const progress = typeof body.progress === "number" ? Math.max(0, Math.min(0.89, body.progress)) : status === "generating" ? 0.35 : 0.1;
    const stage = text(body.stage) ?? text(body.message) ?? (status === "generating" ? "Generating video" : status === "queued" ? "Waiting for generation service" : status);
    const error = status === "failed" ? text(body.error) ?? text(body.message) ?? "Generation failed" : null;
    const actualCost = money(body.costUsd);
    return updateGeneration(id, { status, progress, stage, error, ...(actualCost === null ? {} : { actual_cost_usd: actualCost }) });
  } catch (error) {
    const current = getGeneration(id);
    const importing = current?.status === "downloading" || current?.status === "importing";
    return updateGeneration(id, { ...(importing ? { status: "failed" } : {}), stage: importing ? "Could not import generated video" : "Could not refresh generation status", error: (error as Error).message });
  }
}

export async function projectVideoGenerations(projectId: string, refresh = true) {
  const generations = listGenerations(projectId);
  if (!refresh) return generations;
  return Promise.all(generations.map(item => ACTIVE.has(item.status) || (TRANSFERRING.has(item.status) && Date.now() - item.updatedAt >= RECOVER_TRANSFER_AFTER_MS)
    ? refreshVideoGeneration(item.id, projectId) : item));
}

export async function cancelVideoGeneration(id: string, projectId: string) {
  const generation = getGeneration(id);
  if (!generation || generation.projectId !== projectId) throw new Error("Video generation not found");
  if (!ACTIVE.has(generation.status)) return generation;
  const config = resolvedVideoGenerationConfig();
  if (config.cancelUrl) {
    await json(await fetch(config.cancelUrl, { method: "POST", headers: headers(config.token), signal: AbortSignal.timeout(30_000), body: JSON.stringify({ requestId: generation.remoteId ?? generation.id }) }));
  }
  return updateGeneration(id, { status: "cancelled", stage: config.cancelUrl ? "Cancelled" : "Stopped tracking locally", error: null });
}

export async function retryVideoGeneration(id: string, projectId: string) {
  const generation = getGeneration(id);
  if (!generation || generation.projectId !== projectId) throw new Error("Video generation not found");
  return submitVideoGeneration(projectId, generation.request);
}
