import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ASSETS, WORKSPACE, projectDir } from "../../../common/server/config";
import { FFMPEG, run } from "../../../common/server/bin";
import { q } from "../../../common/server/db";
import { registerAsset, toAbs } from "../../media/server/assets";
import { probe } from "../../media/server/ffmpeg";
import { voiceoverChunks } from "../lib";
import { VOICEOVER_GENERATION_TIMEOUT_MS, VOICEOVER_MODEL_FILES, VOICEOVER_PROBE_TIMEOUT_MS } from "../data";
import {
  VoiceoverConfiguration, VoiceoverInput, VoiceoverRuntime, VoiceoverSettings,
  type VoiceoverFingerprint, type VoiceoverResult, type VoiceoverStatus,
  type VoiceoverWorkerInvoker, type VoiceoverWorkerRequest,
} from "../types";

const worker = path.join(ASSETS, "chatterbox-worker.py");
const configFile = path.join(WORKSPACE, "voiceover.local.json");
const lockFile = path.join(WORKSPACE, "voiceover.lock");

declare global { var __agentcutVoiceoverWorker: VoiceoverWorkerInvoker | undefined; }

/** Explicit test seam: production calls always use the packaged offline Python worker. */
export function setVoiceoverWorkerForTests(invoke: VoiceoverWorkerInvoker | undefined) {
  globalThis.__agentcutVoiceoverWorker = invoke;
}

function settingsFromEnvironment(settings?: VoiceoverSettings): VoiceoverSettings {
  return {
    pythonPath: process.env.AGENTCUT_CHATTERBOX_PYTHON ?? settings?.pythonPath ?? "",
    modelDir: process.env.AGENTCUT_CHATTERBOX_MODEL_DIR ?? settings?.modelDir ?? "",
    model: (process.env.AGENTCUT_CHATTERBOX_MODEL ?? settings?.model ?? "nano") as VoiceoverSettings["model"],
    device: (process.env.AGENTCUT_CHATTERBOX_DEVICE ?? settings?.device ?? "auto") as VoiceoverSettings["device"],
    threads: Number(process.env.AGENTCUT_CHATTERBOX_THREADS ?? settings?.threads ?? 2),
  };
}

async function readConfiguration() {
  const text = await fs.readFile(configFile, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (text === null) return null;
  return VoiceoverConfiguration.parse(JSON.parse(text));
}

async function localPath(file: string, directory = false) {
  if (!path.isAbsolute(file) || /^(?:\\\\|\/\/)/.test(file)) throw new Error("Choose an absolute path on a local disk.");
  const real = await fs.realpath(file).catch(() => { throw new Error("The selected local Chatterbox file or directory is missing."); });
  if (/^(?:\\\\|\/\/)/.test(real)) throw new Error("Chatterbox requires local disk files.");
  const stat = await fs.stat(real);
  if (directory ? !stat.isDirectory() : !stat.isFile()) throw new Error(`Choose a local ${directory ? "directory" : "file"}.`);
  return real;
}

async function validateFiles(given: VoiceoverSettings): Promise<{ settings: VoiceoverSettings; fingerprints: VoiceoverFingerprint[] }> {
  const settings = VoiceoverSettings.parse(given);
  settings.pythonPath = await localPath(settings.pythonPath);
  settings.modelDir = await localPath(settings.modelDir, true);
  if (!/^python(?:3(?:\.\d+)?)?(?:\.exe)?$/i.test(path.basename(settings.pythonPath))) {
    throw new Error("Select the Python interpreter from your local Chatterbox environment.");
  }
  const checkpoint = settings.model === "nano" ? "t3_nano_v1.safetensors" : "t3_turbo_v1.safetensors";
  const files = [settings.pythonPath, worker, ...[...VOICEOVER_MODEL_FILES, checkpoint].map((name) => path.join(settings.modelDir, name))];
  const fingerprints: VoiceoverFingerprint[] = [];
  for (const file of files) {
    const stat = await fs.stat(file).catch(() => { throw new Error(`Missing Chatterbox runtime file: ${path.basename(file)}.`); });
    if (!stat.isFile() || stat.size === 0) throw new Error(`Invalid Chatterbox runtime file: ${path.basename(file)}.`);
    fingerprints.push({ file, size: stat.size, mtimeMs: stat.mtimeMs });
  }
  return { settings, fingerprints };
}

/** The file lock also prevents separate CLI and studio processes using the GPU together. */
async function exclusively<T>(operation: () => Promise<T>) {
  await fs.mkdir(WORKSPACE, { recursive: true });
  const lock = await fs.open(lockFile, "wx").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "EEXIST") throw new Error("Chatterbox is busy. Wait for the current voice-over job to finish. If its process crashed, remove workspace/voiceover.lock before retrying.");
    throw error;
  });
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: Date.now() }));
    return await operation();
  } finally {
    await lock.close();
    await fs.rm(lockFile, { force: true });
  }
}

async function invokeWorker(pythonPath: string, request: VoiceoverWorkerRequest, dir: string) {
  await fs.mkdir(dir, { recursive: true });
  const requestFile = path.join(dir, "chatterbox-request.json");
  await fs.writeFile(requestFile, JSON.stringify(request));
  if (globalThis.__agentcutVoiceoverWorker) return globalThis.__agentcutVoiceoverWorker(pythonPath, request, dir);
  const { stdout } = await run(pythonPath, ["-I", worker, requestFile], {
    cwd: dir,
    timeoutMs: request.action === "probe" ? VOICEOVER_PROBE_TIMEOUT_MS : VOICEOVER_GENERATION_TIMEOUT_MS,
    maxBuffer: 2 * 1024 * 1024,
  });
  try { return JSON.parse(stdout.trim().split(/\r?\n/).at(-1) ?? ""); }
  catch { throw new Error("The local Chatterbox worker returned an invalid response."); }
}

export async function voiceoverStatus(): Promise<VoiceoverStatus> {
  let settings = settingsFromEnvironment();
  try {
    const config = await readConfiguration();
    settings = settingsFromEnvironment(config?.settings);
    if (!config) return { ready: false, message: "Configure the installed local Chatterbox runtime to enable voice-over.", settings };
    const checked = await validateFiles(settings);
    if (JSON.stringify(checked.fingerprints) !== JSON.stringify(config.fingerprints) || JSON.stringify(checked.settings) !== JSON.stringify(config.settings)) {
      return { ready: false, message: "Chatterbox settings or runtime files changed. Check and save the runtime again.", settings };
    }
    return { ready: true, message: `Chatterbox ${settings.model === "nano" ? "Nano" : "Turbo"} is ready. Speech is generated locally.`, settings, runtime: config.runtime };
  } catch (error) {
    return { ready: false, message: error instanceof Error ? error.message : "Local Chatterbox configuration is invalid.", settings };
  }
}

export async function configureVoiceover(given: VoiceoverSettings): Promise<VoiceoverStatus> {
  return exclusively(async () => {
    const checked = await validateFiles(given);
    const dir = path.join(WORKSPACE, "voiceover", "setup", randomUUID());
    const runtime = VoiceoverRuntime.parse(await invokeWorker(checked.settings.pythonPath, { action: "probe" }, dir));
    if (checked.settings.device === "cuda" && !runtime.cudaAvailable) throw new Error("CUDA is unavailable in this runtime. Choose CPU or install compatible CUDA-enabled PyTorch.");
    const config: VoiceoverConfiguration = { version: 1, ...checked, runtime };
    const temp = `${configFile}.${randomUUID()}.tmp`;
    await fs.writeFile(temp, JSON.stringify(config, null, 2));
    try { await fs.rename(temp, configFile); }
    catch (error) { await fs.rm(temp, { force: true }); throw error; }
    return voiceoverStatus();
  });
}

async function referenceFor(projectId: string, id?: string) {
  if (!id) return null;
  const asset = q.listAssets("audio", projectId).find((row) => row.id === id);
  if (!asset) throw new Error("Choose an audio reference from this project's assets or the shared library.");
  const file = await localPath(toAbs(asset.path));
  const stat = await fs.stat(file);
  if (stat.size > 30 * 1024 * 1024) throw new Error("Voice reference audio must be smaller than 30 MB.");
  const metadata = await probe(file);
  if (!metadata.hasAudio || !Number.isFinite(metadata.durationSec) || metadata.durationSec < 5.1 || metadata.durationSec > 30) {
    throw new Error("Choose a voice reference containing 5.1–30 seconds of clean speech.");
  }
  return file;
}

export async function generateVoiceover(projectId: string, given: VoiceoverInput): Promise<VoiceoverResult> {
  const input = VoiceoverInput.parse(given);
  if (!q.getProject(projectId)) throw new Error("Project not found.");
  return exclusively(async () => {
    const status = await voiceoverStatus();
    if (!status.ready) throw new Error(status.message);
    const chunks = voiceoverChunks(input.text);
    if (!chunks.length) throw new Error("Enter some spoken text for the voice-over.");
    const referencePath = await referenceFor(projectId, input.referenceAssetId);
    const dir = path.join(projectDir(projectId), "voiceover", randomUUID());
    await fs.mkdir(dir, { recursive: true });
    const { settings } = status;
    const result = await invokeWorker(settings.pythonPath, {
      action: "generate", modelDir: settings.modelDir, model: settings.model,
      device: settings.device, threads: settings.threads, chunks, outputDir: dir, referencePath,
    }, dir) as { engine?: string; offline?: boolean; parts?: number };
    if (result?.engine !== "chatterbox" || result.offline !== true || result.parts !== chunks.length) {
      throw new Error("The local Chatterbox worker did not finish the requested speech.");
    }
    for (let i = 0; i < chunks.length; i++) {
      const part = path.join(dir, `part-${i}.wav`);
      const metadata = await probe(part);
      if (!metadata.hasAudio || !Number.isFinite(metadata.durationSec) || metadata.durationSec < 0.05 || metadata.durationSec > 30) {
        throw new Error("Chatterbox returned an empty or invalid speech phrase. Retry with shorter text.");
      }
    }
    const manifest = path.join(dir, "parts.txt");
    await fs.writeFile(manifest, chunks.map((_, index) => `file 'part-${index}.wav'`).join("\n"));
    const output = path.join(dir, "voiceover.wav");
    await run(FFMPEG, ["-hide_banner", "-nostdin", "-y", "-f", "concat", "-safe", "1", "-i", manifest, "-vn", "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", output], { timeoutMs: 120_000 });
    const metadata = await probe(output);
    if (!metadata.hasAudio || !Number.isFinite(metadata.durationSec) || metadata.durationSec < 0.05 || metadata.durationSec > chunks.length * 30 + 1) {
      throw new Error("The generated voice-over has invalid audio timing.");
    }
    await fs.writeFile(path.join(dir, "generation.json"), JSON.stringify({ engine: "chatterbox", model: settings.model, text: input.text, runtime: result, durationSec: metadata.durationSec }, null, 2));
    const asset = await registerAsset({
      file: output, kind: "audio", scope: "project", projectId,
      name: input.name ?? "Chatterbox voice-over", tags: "voiceover,chatterbox,local", source: "chatterbox",
      attribution: "Generated locally with Chatterbox; upstream Perth watermark retained.",
    });
    return {
      asset, engine: "chatterbox", durationSec: metadata.durationSec,
      provenance: { engine: "chatterbox", model: settings.model, referenceAssetId: input.referenceAssetId ?? null, offline: true },
    };
  });
}
