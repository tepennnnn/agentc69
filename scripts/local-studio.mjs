import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = createRequire(path.join(root, "packages", "core", "package.json"));
const ffmpeg = load("ffmpeg-static");
const ffprobe = load("ffprobe-static").path;
const next = path.join(root, "apps/studio/node_modules/next/dist/bin/next");
if (!fs.existsSync(next)) throw new Error("Install the workspace dependencies with pnpm install --frozen-lockfile first.");
const env = {
  ...process.env,
  AGENTCUT_ROOT: root,
  AGENTCUT_WORKSPACE: process.env.AGENTCUT_WORKSPACE || path.join(root, "workspace"),
  AGENTCUT_HOME: process.env.AGENTCUT_HOME || path.join(root, "runtime", "agentcut"),
  AGENTCUT_FFMPEG: process.env.AGENTCUT_FFMPEG || ffmpeg,
  AGENTCUT_FFPROBE: process.env.AGENTCUT_FFPROBE || ffprobe,
  NEXT_TELEMETRY_DISABLED: "1",
};
const port = process.env.PORT || "7937";
console.log(`AgentCut Local: http://127.0.0.1:${port}`);
const child = spawn(process.execPath, [next, "dev", "--hostname", "127.0.0.1", "--port", port], {
  cwd: path.join(root, "apps", "studio"), env, stdio: "inherit", windowsHide: true,
});
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => { process.exitCode = code ?? 1; });
