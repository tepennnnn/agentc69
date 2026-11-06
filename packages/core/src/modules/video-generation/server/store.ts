import { randomUUID } from "node:crypto";
import { db, q } from "../../../common/server/db";
import { VideoGenerationRequest, VideoGenerationStatus, type VideoGeneration, type VideoGenerationProvenance } from "../types";

db.exec(`
  CREATE TABLE IF NOT EXISTS video_generations (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL REFERENCES projects(id),
    provider        TEXT NOT NULL,
    request_json    TEXT NOT NULL,
    remote_id       TEXT,
    status          TEXT NOT NULL,
    progress        REAL NOT NULL DEFAULT 0,
    stage           TEXT NOT NULL DEFAULT '',
    error           TEXT,
    output_media_id TEXT,
    model           TEXT,
    estimated_cost_usd REAL,
    actual_cost_usd REAL,
    provenance_json TEXT,
    output_sha256   TEXT,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS video_generations_project ON video_generations(project_id, created_at DESC);
`);

const columns = new Set((db.prepare("PRAGMA table_info(video_generations)").all() as Array<{ name: string }>).map((column) => column.name));
for (const [name, type] of Object.entries({ model: "TEXT", estimated_cost_usd: "REAL", actual_cost_usd: "REAL", provenance_json: "TEXT", output_sha256: "TEXT" })) {
  if (!columns.has(name)) db.exec(`ALTER TABLE video_generations ADD COLUMN ${name} ${type}`);
}

type Row = {
  id: string; project_id: string; provider: string; request_json: string; remote_id: string | null;
  status: string; progress: number; stage: string; error: string | null; output_media_id: string | null;
  model: string | null; estimated_cost_usd: number | null; actual_cost_usd: number | null; provenance_json: string | null; output_sha256: string | null;
  created_at: number; updated_at: number;
};

function generation(row: Row): VideoGeneration {
  const request = VideoGenerationRequest.parse(JSON.parse(row.request_json));
  const stored = row.provenance_json ? JSON.parse(row.provenance_json) as VideoGenerationProvenance : null;
  return {
    id: row.id,
    projectId: row.project_id,
    provider: "n8n", model: row.model ?? request.model ?? null,
    request,
    remoteId: row.remote_id,
    status: VideoGenerationStatus.parse(row.status),
    progress: row.progress,
    stage: row.stage,
    error: row.error,
    outputMediaId: row.output_media_id,
    estimatedCostUsd: row.estimated_cost_usd,
    actualCostUsd: row.actual_cost_usd,
    outputSha256: row.output_sha256,
    provenance: {
      provider: "n8n", model: row.model ?? request.model ?? null, mode: request.mode,
      originalPrompt: stored?.originalPrompt ?? request.prompt,
      enhancedPrompt: stored?.enhancedPrompt ?? request.prompt,
      inputAssetIds: stored?.inputAssetIds ?? [], seed: stored?.seed ?? request.seed ?? null,
      remoteJobId: row.remote_id,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createGeneration(projectId: string, request: VideoGenerationRequest, provenance: VideoGenerationProvenance, estimatedCostUsd: number | null): VideoGeneration {
  if (!q.getProject(projectId)) throw new Error("Project not found");
  const id = `vg_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
  const now = Date.now();
  db.prepare(`INSERT INTO video_generations
    (id, project_id, provider, request_json, model, estimated_cost_usd, provenance_json, status, progress, stage, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'submitting', 0, 'Submitting to n8n', ?, ?)`)
    .run(id, projectId, request.provider, JSON.stringify(request), request.model ?? null, estimatedCostUsd, JSON.stringify(provenance), now, now);
  return getGeneration(id)!;
}

export function getGeneration(id: string): VideoGeneration | null {
  const row = db.prepare("SELECT * FROM video_generations WHERE id = ?").get(id) as Row | undefined;
  return row ? generation({ ...row }) : null;
}

export function listGenerations(projectId: string): VideoGeneration[] {
  return (db.prepare("SELECT * FROM video_generations WHERE project_id = ? ORDER BY created_at DESC LIMIT 100").all(projectId) as unknown as Row[])
    .map(row => generation({ ...row }));
}

export function updateGeneration(id: string, patch: Partial<Pick<Row, "remote_id" | "status" | "progress" | "stage" | "error" | "output_media_id" | "actual_cost_usd" | "output_sha256">>): VideoGeneration {
  const keys = Object.keys(patch);
  if (!keys.length) return getGeneration(id)!;
  db.prepare(`UPDATE video_generations SET ${keys.map(key => `${key} = ?`).join(", ")}, updated_at = ? WHERE id = ?`)
    .run(...keys.map(key => (patch as Record<string, string | number | null>)[key]), Date.now(), id);
  const next = getGeneration(id);
  if (!next) throw new Error("Generation not found");
  return next;
}

export function deleteGenerationsForProject(projectId: string) {
  db.prepare("DELETE FROM video_generations WHERE project_id = ?").run(projectId);
}
