import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scripts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("local Studio supplies checkout FFmpeg and FFprobe binaries", () => {
  const source = fs.readFileSync(path.join(scripts, "local-studio.mjs"), "utf8");
  assert.match(source, /AGENTCUT_FFMPEG:/);
  assert.match(source, /AGENTCUT_FFPROBE:/);
  assert.match(source, /ffmpeg-static/);
  assert.match(source, /ffprobe-static/);
});
