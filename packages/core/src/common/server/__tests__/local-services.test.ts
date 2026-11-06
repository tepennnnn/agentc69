import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

let workspace: string;
let bin: typeof import("../bin");
let registry: typeof import("../../../modules/publishing/server/providers/registry");
let publishing: typeof import("../../../modules/publishing/server/store");
let http: typeof import("../../../modules/publishing/server/providers/http");
let photos: typeof import("../../../modules/media/server/search/photos");
let images: typeof import("../../../modules/media/server/search/index");
let database: typeof import("../db");
const previousWorkspace = process.env.AGENTCUT_WORKSPACE;

before(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "agentcut-local-services-"));
  process.env.AGENTCUT_WORKSPACE = workspace;
  [bin, registry, publishing, http, photos, images, database] = await Promise.all([
    import("../bin"),
    import("../../../modules/publishing/server/providers/registry"),
    import("../../../modules/publishing/server/store"),
    import("../../../modules/publishing/server/providers/http"),
    import("../../../modules/media/server/search/photos"),
    import("../../../modules/media/server/search/index"),
    import("../db"),
  ]);
});

after(async () => {
  database?.db.close();
  if (previousWorkspace === undefined) delete process.env.AGENTCUT_WORKSPACE;
  else process.env.AGENTCUT_WORKSPACE = previousWorkspace;
  await fs.rm(workspace, { recursive: true, force: true });
});

test("tool discovery finds Windows executables on PATH without a Unix which command", async () => {
  const directory = path.join(workspace, "tools with spaces");
  await fs.mkdir(directory);
  const name = `agentcut-fixture-${process.pid}`;
  const executable = path.join(directory, `${name}${process.platform === "win32" ? ".exe" : ""}`);
  await fs.writeFile(executable, "fixture", { mode: 0o755 });
  const previousPath = process.env.PATH;
  process.env.PATH = directory;
  try {
    assert.equal(await bin.which(name), executable);
    assert.equal(await bin.which(executable), executable);
    assert.equal(await bin.which(directory), null);
    assert.equal(await bin.which(`${name}-missing`), null);
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
  }
});

test("paid publishing cannot be connected, while local phone records remain usable", () => {
  for (const provider of ["postgun", "postbridge"] as const) {
    assert.throws(() => registry.saveConnection({ provider, name: provider, key: "fixture" }), /Paid publishing services are disabled/);
  }
  assert.deepEqual(publishing.connections(), []);
  const phone = registry.saveConnection({ provider: "iphone", name: "Local phone" });
  assert.equal(phone.provider, "iphone");
  assert.equal(phone.configured, true);
});

test("restored paid publishing connections are blocked before any network request", async (t) => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => { requests++; throw new Error("Unexpected network request"); });
  for (const provider of ["postgun", "postbridge"] as const) {
    publishing.put("connection", provider, { id: provider, provider, name: provider, baseUrl: "https://example.invalid", configured: true });
    publishing.setSecret(provider, "fixture");
    for (const method of ["GET", "POST", "DELETE"]) {
      await assert.rejects(http.request(provider, "/posts", method), (error: unknown) =>
        error instanceof http.DeliveryError && !error.uncertain && /Paid publishing services are disabled/.test(error.message));
    }
  }
  assert.equal(requests, 0);
});

test("Google CSE stays unavailable even with credentials, while free image providers remain listed", async (t) => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => { requests++; throw new Error("Unexpected network request"); });
  const savedKey = process.env.AGENTCUT_GOOGLE_CSE_KEY;
  const savedCx = process.env.AGENTCUT_GOOGLE_CSE_CX;
  process.env.AGENTCUT_GOOGLE_CSE_KEY = "fixture";
  process.env.AGENTCUT_GOOGLE_CSE_CX = "fixture";
  try {
    await assert.rejects(photos.googleImages.search("test", 1), /Google Programmable Search is disabled/);
    assert.equal(photos.configuredKeyedProviders().includes("google"), false);
    const listed = images.listProviders();
    assert.equal(listed.some((provider) => provider.id === "google"), false);
    for (const id of ["brand", "commons", "openverse", "pexels", "unsplash"]) assert.ok(listed.some((provider) => provider.id === id));
    const explicit = await images.searchImagesDetailed("test", 1, ["google"]);
    assert.deepEqual(explicit.hits, []);
    assert.equal(explicit.failures[0]?.provider, "google");
  } finally {
    if (savedKey === undefined) delete process.env.AGENTCUT_GOOGLE_CSE_KEY; else process.env.AGENTCUT_GOOGLE_CSE_KEY = savedKey;
    if (savedCx === undefined) delete process.env.AGENTCUT_GOOGLE_CSE_CX; else process.env.AGENTCUT_GOOGLE_CSE_CX = savedCx;
  }
  assert.equal(requests, 0);
});
