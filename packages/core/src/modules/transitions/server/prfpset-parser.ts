import fs from "node:fs/promises";
import path from "node:path";
import type { TransitionPreset, TransitionImportResult } from "../types";

/**
 * Maps a preset name or bin name to one of AgentCut's supported Remotion TransitionKind.
 */
function classifyTransitionKind(name: string, bin: string): TransitionPreset["kind"] {
  const lower = `${bin} ${name}`.toLowerCase();
  if (lower.includes("glitch")) return "glitch";
  if (lower.includes("wiggle")) return "wiggle";
  if (lower.includes("stretch") || lower.includes("strech")) return "stretch";
  if (lower.includes("offset")) return "offset";
  if (lower.includes("zoom")) return "zoom";
  if (lower.includes("wipe")) return "wipe";
  if (lower.includes("dip")) return "dip";
  if (lower.includes("slide")) return "slide";
  return "dissolve";
}

/**
 * Fast streaming / regex-based parser for Premiere Pro XML preset files (.prfpset).
 * Avoids DOM parser vulnerabilities while accurately extracting preset bins, items, and effect names.
 */
export async function parsePrfpsetFile(filePath: string): Promise<TransitionImportResult> {
  const content = await fs.readFile(filePath, "utf-8");
  return parsePrfpsetXml(content);
}

export function parsePrfpsetXml(xml: string): TransitionImportResult {
  const binRegex = /<BinTreeItem[\s\S]*?<Name>(.*?)<\/Name>[\s\S]*?<\/BinTreeItem>/g;
  const binsFound: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = binRegex.exec(xml)) !== null) {
    const binName = match[1]?.trim();
    if (binName && !binsFound.includes(binName) && binName !== "Root" && binName !== "Presets") {
      binsFound.push(binName);
    }
  }

  // Extract preset TreeItems
  const itemRegex = /<TreeItem\s+ObjectID="(\d+)"[\s\S]*?<Name>(.*?)<\/Name>[\s\S]*?<\/TreeItem>/g;
  const presets: TransitionPreset[] = [];
  const seenNames = new Set<string>();

  while ((match = itemRegex.exec(xml)) !== null) {
    const id = match[1];
    const name = match[2]?.trim();
    if (!name || seenNames.has(name)) continue;
    seenNames.add(name);

    // Determine category and bin from preset name
    let detectedBin = "General";
    for (const bin of binsFound) {
      const simplifiedBin = bin.replace(/^WGFX\s*/i, "").toLowerCase();
      if (name.toLowerCase().includes(simplifiedBin)) {
        detectedBin = bin;
        break;
      }
    }

    const kind = classifyTransitionKind(name, detectedBin);

    presets.push({
      id: `wgfx_${id}_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      name,
      bin: detectedBin,
      category: detectedBin.replace(/^WGFX\s*/i, "").replace(/\s*Transitions$/i, "").trim() || "Transitions",
      effectType: "transform",
      kind,
      durationSec: 0.5,
      description: `WGFX Premiere preset: ${name}`,
    });
  }

  return {
    totalImported: presets.length,
    bins: binsFound,
    presets,
  };
}
