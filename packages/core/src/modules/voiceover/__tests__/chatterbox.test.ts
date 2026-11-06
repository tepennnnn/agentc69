import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { VoiceoverCloneInput, VoiceoverInput, VoiceoverSettings } from "../types";
import { voiceoverChunks } from "../lib";
import { VOICEOVER_MODEL_FILES } from "../data";

let root: string;
let settings: VoiceoverSettings;
let service: typeof import("../server/chatterbox");
let database: typeof import("../../../common/server/db");
let editor: typeof import("../../editor/server/tools");

function wave(seconds = 0.15) {
  const samples = Math.round(24_000 * seconds);
  const bytes = Buffer.alloc(44 + samples * 2);
  bytes.write("RIFF", 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(24_000, 24); bytes.writeUInt32LE(48_000, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36); bytes.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) bytes.writeInt16LE(Math.round(Math.sin(i * 440 * 2 * Math.PI / 24_000) * 2000), 44 + i * 2);
  return bytes;
}

const runtime = { version: "test", torch: "test", perth: "test", cudaAvailable: false, gpu: null, python: "test" };

before(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "agentcut-voiceover-"));
  process.env.AGENTCUT_WORKSPACE = path.join(root, "workspace");
  for (const name of ["PYTHON", "MODEL_DIR", "MODEL", "DEVICE", "THREADS"]) delete process.env[`AGENTCUT_CHATTERBOX_${name}`];
  const pythonPath = path.join(root, "python.exe");
  const modelDir = path.join(root, "model");
  await fs.mkdir(modelDir);
  await fs.writeFile(pythonPath, "test interpreter; the explicit worker test seam handles calls");
  for (const file of [...VOICEOVER_MODEL_FILES, "t3_nano_v1.safetensors"]) await fs.writeFile(path.join(modelDir, file), "fixture");
  settings = { pythonPath, modelDir, model: "nano", device: "cpu", threads: 2 };
  service = await import("../server/chatterbox");
  database = await import("../../../common/server/db");
  editor = await import("../../editor/server/tools");
});

after(async () => {
  service?.setVoiceoverWorkerForTests(undefined);
  database?.db.close();
  await fs.rm(root, { recursive: true, force: true });
});

test("speech schemas reject empty text, excessive scripts and unknown provider fields", () => {
  assert.throws(() => VoiceoverInput.parse({ text: "  " }));
  assert.throws(() => VoiceoverInput.parse({ text: "a".repeat(10_001) }));
  assert.throws(() => VoiceoverInput.parse({ text: "Hello", provider: "paid" }));
  assert.throws(() => VoiceoverSettings.parse({ ...settings, threads: 8 }));
  assert.throws(() => VoiceoverCloneInput.parse({ text: "Clone me" }), /referenceAssetId/);
});

test("long scripts are split into bounded phrases without dropping words", () => {
  const text = `${"One two three ".repeat(80)}. A final sentence!`;
  const chunks = voiceoverChunks(text);
  assert.ok(chunks.length > 2);
  assert.ok(chunks.every((chunk) => chunk.text.length > 0 && chunk.text.length <= 200));
  assert.equal(chunks.map((chunk) => chunk.text).join(" ").replace(/\s+/g, " "), text.trim().replace(/\s+/g, " "));
  const word = "a".repeat(501);
  assert.equal(voiceoverChunks(word).map((chunk) => chunk.text).join(""), word);
  assert.deepEqual(voiceoverChunks("First line\nSecond line"), [{ text: "First line" }, { text: "Second line" }]);
});

test("runtime configuration needs existing local files, an offline probe and compatible CUDA", async () => {
  assert.equal((await service.voiceoverStatus()).ready, false);
  await assert.rejects(service.configureVoiceover({ ...settings, modelDir: path.join(root, "missing") }), /missing/);
  service.setVoiceoverWorkerForTests(async (_python, request) => {
    assert.equal(request.action, "probe");
    return runtime;
  });
  await assert.rejects(service.configureVoiceover({ ...settings, device: "cuda" }), /CUDA is unavailable/);
  const status = await service.configureVoiceover(settings);
  assert.equal(status.ready, true);
  assert.equal(status.runtime?.cudaAvailable, false);
  await fs.appendFile(path.join(settings.modelDir, "vocab.json"), "changed");
  assert.equal((await service.voiceoverStatus()).ready, false);
  await service.configureVoiceover(settings);
});

test("speech generation registers one usable project asset without editing the timeline", async () => {
  database.q.insertProject({ id: "voiceover-contract", name: "Voiceover contract", source_path: "", created_at: Date.now() });
  const before = database.q.getProject("voiceover-contract");
  service.setVoiceoverWorkerForTests(async (_python, request, dir) => {
    assert.equal(request.action, "generate");
    assert.equal(request.referencePath, null);
    for (let i = 0; i < request.chunks!.length; i++) await fs.writeFile(path.join(dir, `part-${i}.wav`), wave());
    return { engine: "chatterbox", offline: true, parts: request.chunks!.length };
  });
  const result = await service.generateVoiceover("voiceover-contract", { text: "Hello world. Another phrase!", name: "Narration" });
  assert.equal(result.engine, "chatterbox");
  assert.equal(result.asset.kind, "audio");
  assert.equal(result.asset.project_id, "voiceover-contract");
  assert.equal(result.asset.name, "Narration");
  assert.ok(result.durationSec >= 0.29 && result.durationSec <= 0.31);
  assert.ok(database.q.listAssets("audio", "voiceover-contract").some((asset) => asset.id === result.asset.id));
  assert.deepEqual(database.q.getProject("voiceover-contract"), before);
});

test("voiceover.clone uses the same offline worker with a required reference and returns clone provenance", async () => {
  const referenceFile = path.join(root, "voice-reference.wav");
  await fs.writeFile(referenceFile, wave(6));
  const { registerAsset } = await import("../../media/server/assets");
  const reference = await registerAsset({ file: referenceFile, kind: "audio", scope: "project", projectId: "voiceover-contract", name: "Reference voice", source: "test" });
  service.setVoiceoverWorkerForTests(async (_python, request, dir) => {
    assert.equal(request.action, "generate");
    assert.equal(request.referencePath, referenceFile);
    for (let index = 0; index < request.chunks!.length; index++) await fs.writeFile(path.join(dir, `part-${index}.wav`), wave());
    return { engine: "chatterbox", offline: true, parts: request.chunks!.length };
  });

  const result = await editor.executeEditorTool("voiceover-contract", {
    tool: "voiceover.clone", text: "This voice is cloned locally.", referenceAssetId: reference.id,
  }) as Awaited<ReturnType<typeof service.generateVoiceover>>;

  assert.equal(result.engine, "chatterbox");
  assert.deepEqual(result.provenance, { engine: "chatterbox", model: "nano", referenceAssetId: reference.id, offline: true });
});

test("reference assets outside the project and unfinished model output never become generated assets", async () => {
  await assert.rejects(service.generateVoiceover("voiceover-contract", { text: "Hello", referenceAssetId: "not-an-accessible-asset" }), /reference.*project/);
  const before = database.q.listAssets("audio", "voiceover-contract").length;
  service.setVoiceoverWorkerForTests(async () => ({ engine: "paid", offline: false, parts: 1 }));
  await assert.rejects(service.generateVoiceover("voiceover-contract", { text: "Hello" }), /did not finish/);
  assert.equal(database.q.listAssets("audio", "voiceover-contract").length, before);
});

test("an active worker excludes simultaneous inference and releases the lock after failure", async () => {
  let release: (() => void) | undefined;
  let entered: (() => void) | undefined;
  const started = new Promise<void>((resolve) => { entered = resolve; });
  service.setVoiceoverWorkerForTests(async () => {
    entered!();
    await new Promise<void>((resolve) => { release = resolve; });
    throw new Error("simulated worker failure");
  });
  const pending = service.generateVoiceover("voiceover-contract", { text: "Hello" });
  await started;
  await assert.rejects(service.generateVoiceover("voiceover-contract", { text: "Another" }), /Chatterbox is busy/);
  release!();
  await assert.rejects(pending, /simulated worker failure/);
  await assert.rejects(fs.stat(path.join(process.env.AGENTCUT_WORKSPACE!, "voiceover.lock")), { code: "ENOENT" });
});
