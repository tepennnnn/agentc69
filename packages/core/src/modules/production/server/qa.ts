import fs from "node:fs/promises";
import path from "node:path";
import { projectDir } from "../../../common/server/config";
import { contentSignature } from "../../editor/server/signature";
import { readEditor } from "../../editor/server/store";
import { loudness, probe } from "../../media/server/ffmpeg";
import { auditStyle } from "../../render/server/style-check";
import { runReview } from "../../review/server/review";
import { PostRenderQaReport, type PostRenderQaReport as PostRenderQaReportType } from "../types";
import { readProduction, saveQaReport } from "./workflow";

type Finding = PostRenderQaReportType["findings"][number];

/** Inspect the exported deliverable and persist the verdict even when inspection fails. */
export async function runPostRenderQa(projectId: string, expectedRevision: number, sequenceId?: string) {
  const production = readProduction(projectId);
  if (!production) throw new Error("Start a production run before post-render QA.");
  if (production.revision !== expectedRevision) throw new Error(`Production revision changed from ${expectedRevision} to ${production.revision}.`);
  const snapshot = readEditor(projectId);
  const deliverables = [...snapshot.edl.clips, ...snapshot.edl.sequences]
    .filter((deliverable) => !sequenceId || deliverable.id === sequenceId);
  if (sequenceId && !deliverables.length) throw new Error("Deliverable not found");
  const findings: Finding[] = [];
  const outputs: Array<Record<string, unknown>> = [];
  if (!deliverables.length) findings.push({ severity: "critical", message: "This project has no clips or sequences to validate." });

  try {
    const manifestPath = path.join(projectDir(projectId), "rendered.json");
    const rawManifest = await fs.readFile(manifestPath, "utf8").catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") throw new Error("Render manifest is missing; render the project before QA.");
      throw error;
    });
    const manifest = JSON.parse(rawManifest) as Record<string, { revision?: number; file?: string; signature?: string }>;
    for (const deliverable of deliverables) {
      const entry = manifest[deliverable.id];
      if (!entry?.file) {
        findings.push({ severity: "critical", message: `${deliverable.title} is not rendered in the current manifest.` });
        continue;
      }
      const expectedSignature = contentSignature(snapshot.edl, deliverable.id);
      if (entry.signature ? entry.signature !== expectedSignature : entry.revision !== snapshot.revision) {
        findings.push({ severity: "critical", message: `${deliverable.title} render is stale and must be exported again.` });
        continue;
      }
      const file = path.join(projectDir(projectId), "clips", entry.file);
      const technical = await probe(file);
      if (!technical.durationSec || !technical.width || !technical.height || !technical.videoCodec) {
        findings.push({ severity: "critical", message: `${deliverable.title} has an invalid video container or stream.` });
      }
      const sequence = snapshot.edl.sequences.find((candidate) => candidate.id === deliverable.id);
      const [style] = sequence ? await auditStyle(projectId, deliverable.id) : [null];
      for (const check of style?.checks ?? []) {
        if (!check.ok) findings.push({ severity: "warning", message: `${deliverable.title}: ${check.name} — ${check.detail}` });
      }
      const [review] = sequence ? await runReview(projectId, { sequenceId: deliverable.id }) : [null];
      for (const check of review?.checks ?? []) {
        if (!check.ok && check.severity === "critical" && !check.waived) findings.push({ severity: "critical", message: `${deliverable.title}: ${check.id} — ${check.fix}` });
      }
      outputs.push({
        deliverableId: deliverable.id, kind: sequence ? "sequence" : "clip", file: entry.file, revision: entry.revision ?? snapshot.revision,
        probe: technical, loudnessLufs: technical.hasAudio ? await loudness(file) : null, style: style ?? null, review: review ?? null,
      });
    }
  } catch (error) {
    findings.push({ severity: "critical", message: `Post-render inspection failed: ${(error as Error).message}` });
  }

  const report = PostRenderQaReport.parse({
    at: Date.now(), sequenceId: sequenceId ?? null,
    verdict: findings.some((finding) => finding.severity === "critical") ? "failed" : "passed",
    findings, outputs,
  });
  saveQaReport(projectId, expectedRevision, report, sequenceId === undefined);
  return report;
}
