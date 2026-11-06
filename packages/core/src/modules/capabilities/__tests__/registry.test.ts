import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

let workspace: string;
let capabilitySummary: typeof import("../server/registry").capabilitySummary;

before(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "agentcut-capabilities-"));
  process.env.AGENTCUT_WORKSPACE = workspace;
  process.env.AGENTCUT_N8N_TOKEN = "must-not-leak";
  const database = await import("../../../common/server/db");
  database.q.insertProject({ id: "capabilities-test", name: "Capabilities", source_path: "", created_at: Date.now() });
  ({ capabilitySummary } = await import("../server/registry"));
});

after(async () => {
  delete process.env.AGENTCUT_N8N_TOKEN;
  await fs.rm(workspace, { recursive: true, force: true }).catch(() => undefined);
});

test("capability discovery covers every production family without leaking credentials", async () => {
  const providers = await capabilitySummary("capabilities-test");
  const families = new Set(providers.map((provider) => provider.capability));

  assert.deepEqual([...families].sort(), ["image", "music", "rendering", "transcription", "video", "voice"]);
  assert.ok(providers.some((provider) => provider.id === "n8n" && provider.capability === "video"));
  assert.ok(providers.some((provider) => provider.id === "chatterbox" && provider.modes.includes("clone")));
  assert.ok(providers.every((provider) => provider.id && provider.name && provider.setup));
  assert.equal(JSON.stringify(providers).includes("must-not-leak"), false);
});
