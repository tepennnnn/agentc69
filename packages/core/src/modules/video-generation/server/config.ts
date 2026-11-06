import { db } from "../../../common/server/db";
import type { VideoGenerationConfig } from "../types";

db.exec(`CREATE TABLE IF NOT EXISTS settings (
  scope TEXT NOT NULL,
  key   TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (scope, key)
)`);

const SCOPE = "video-generation";
const SECRET_SCOPE = "secret";

type Field = "submitUrl" | "statusUrl" | "cancelUrl" | "outputHosts";
const ENV: Record<Field | "token", string> = {
  submitUrl: "AGENTCUT_N8N_GENERATE_URL",
  statusUrl: "AGENTCUT_N8N_STATUS_URL",
  cancelUrl: "AGENTCUT_N8N_CANCEL_URL",
  outputHosts: "AGENTCUT_GENERATION_OUTPUT_HOSTS",
  token: "AGENTCUT_N8N_TOKEN",
};

function stored(scope: string, key: string): string {
  const row = db.prepare("SELECT value FROM settings WHERE scope = ? AND key = ?").get(scope, key) as { value: string } | undefined;
  return row?.value ?? "";
}

function source(scope: string, key: string, env: string): "workspace" | "environment" | "none" {
  if (stored(scope, key)) return "workspace";
  return process.env[env] ? "environment" : "none";
}

function value(field: Field): string {
  return stored(SCOPE, field) || process.env[ENV[field]] || "";
}

function token(): string {
  return stored(SECRET_SCOPE, "video-generation:n8n-token") || process.env[ENV.token] || "";
}

function requireHttps(raw: string, field: string): string {
  let parsed: URL;
  try { parsed = new URL(raw); } catch { throw new Error(`${field} must be a complete HTTPS URL`); }
  if (parsed.protocol !== "https:") throw new Error(`${field} must use HTTPS`);
  return parsed.toString();
}

export function videoGenerationConfig(): VideoGenerationConfig {
  const submitUrl = value("submitUrl");
  const statusUrl = value("statusUrl");
  const cancelUrl = value("cancelUrl");
  const outputHosts = value("outputHosts");
  const tokenSet = !!token();
  return {
    submitUrl, statusUrl, cancelUrl, outputHosts, tokenSet,
    configured: !!(submitUrl && statusUrl && outputHosts && tokenSet),
    sources: {
      submitUrl: source(SCOPE, "submitUrl", ENV.submitUrl),
      statusUrl: source(SCOPE, "statusUrl", ENV.statusUrl),
      cancelUrl: source(SCOPE, "cancelUrl", ENV.cancelUrl),
      outputHosts: source(SCOPE, "outputHosts", ENV.outputHosts),
      token: source(SECRET_SCOPE, "video-generation:n8n-token", ENV.token),
    },
  };
}

export function resolvedVideoGenerationConfig() {
  const visible = videoGenerationConfig();
  if (!visible.configured) throw new Error("Configure the n8n video generator under Settings → This machine");
  return {
    submitUrl: requireHttps(visible.submitUrl, "Submit URL"),
    statusUrl: requireHttps(visible.statusUrl, "Status URL"),
    cancelUrl: visible.cancelUrl ? requireHttps(visible.cancelUrl, "Cancel URL") : "",
    outputHosts: visible.outputHosts.split(",").map(host => host.trim().toLowerCase()).filter(Boolean),
    token: token(),
  };
}

export function setVideoGenerationConfig(input: Partial<Record<Field | "token", string>>): VideoGenerationConfig {
  for (const field of ["submitUrl", "statusUrl", "cancelUrl"] as const) {
    if (input[field]?.trim()) requireHttps(input[field]!.trim(), field);
  }
  for (const field of ["submitUrl", "statusUrl", "cancelUrl", "outputHosts"] as const) {
    if (input[field] === undefined) continue;
    const next = input[field]!.trim();
    if (next) db.prepare("INSERT INTO settings(scope,key,value) VALUES(?,?,?) ON CONFLICT(scope,key) DO UPDATE SET value=excluded.value").run(SCOPE, field, next);
    else db.prepare("DELETE FROM settings WHERE scope = ? AND key = ?").run(SCOPE, field);
  }
  if (input.token !== undefined) {
    const next = input.token.trim();
    if (next) db.prepare("INSERT INTO settings(scope,key,value) VALUES(?,?,?) ON CONFLICT(scope,key) DO UPDATE SET value=excluded.value").run(SECRET_SCOPE, "video-generation:n8n-token", next);
    else db.prepare("DELETE FROM settings WHERE scope = ? AND key = ?").run(SECRET_SCOPE, "video-generation:n8n-token");
  }
  return videoGenerationConfig();
}
